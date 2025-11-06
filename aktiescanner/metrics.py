from __future__ import annotations

import json
import logging
import math
from collections import OrderedDict
from dataclasses import dataclass, field
from typing import Iterable, Optional
from urllib import error, parse, request

from .company_lists import Company

LOGGER = logging.getLogger(__name__)

_YF_QUOTE_URL = "https://query1.finance.yahoo.com/v10/finance/quoteSummary/{symbol}"
_YF_MODULES = ",".join(
    [
        "price",
        "summaryDetail",
        "defaultKeyStatistics",
        "financialData",
        "balanceSheetHistory",
        "cashflowStatementHistory",
        "incomeStatementHistory",
    ]
)
_USER_AGENT = "Mozilla/5.0 (aktiescanner/1.0)"


@dataclass
class ValuationMetrics:
    symbol: str
    name: str
    segment: str
    price: Optional[float] = None
    market_cap: Optional[float] = None
    pe_ratio: Optional[float] = None
    pb_ratio: Optional[float] = None
    dividend_yield: Optional[float] = None
    ebit: Optional[float] = None
    enterprise_value: Optional[float] = None
    earnings_yield: Optional[float] = None
    return_on_capital: Optional[float] = None
    free_cash_flow: Optional[float] = None
    free_cash_flow_growth: Optional[float] = None
    intrinsic_value: Optional[float] = None
    margin_of_safety: Optional[float] = None
    shares_outstanding: Optional[float] = None
    net_debt: Optional[float] = None
    buffett_intrinsic_value_per_share: Optional[float] = None
    buffett_undervaluation_pct: Optional[float] = None
    buffett_growth_rate: Optional[float] = None
    buffett_discount_rate: Optional[float] = None
    buffett_projection_years: Optional[int] = None
    notes: list[str] = field(default_factory=list)


_BASE_COLUMNS = [
    "symbol",
    "name",
    "segment",
    "price",
    "market_cap",
    "pe_ratio",
    "pb_ratio",
    "dividend_yield",
    "ebit",
    "enterprise_value",
    "earnings_yield",
    "return_on_capital",
    "free_cash_flow",
    "free_cash_flow_growth",
    "intrinsic_value",
    "margin_of_safety",
    "shares_outstanding",
    "net_debt",
    "Intrinsic (BuffettDCF) kr/aktie",
    "Buffett Undervärdering %",
    "buffett_growth_rate",
    "buffett_discount_rate",
    "buffett_projection_years",
    "notes",
]
_RANK_COLUMNS = ["earnings_yield_rank", "return_on_capital_rank", "magic_formula_score"]
OUTPUT_COLUMNS = _BASE_COLUMNS + _RANK_COLUMNS


def _http_get_json(url: str, params: dict[str, str] | None = None, timeout: float = 15.0) -> dict:
    if params:
        url = f"{url}?{parse.urlencode(params)}"
    req = request.Request(url, headers={"User-Agent": _USER_AGENT, "Accept": "application/json"})
    try:
        with request.urlopen(req, timeout=timeout) as resp:
            payload = resp.read()
    except error.URLError as exc:  # pragma: no cover - network failure logging
        LOGGER.exception("Yahoo Finance request failed: %s", exc)
        raise
    try:
        return json.loads(payload.decode("utf-8"))
    except json.JSONDecodeError as exc:
        raise ValueError("Yahoo Finance response was not valid JSON") from exc


def _deep_get(data: dict | None, *path: str) -> Optional[object]:
    current = data
    for key in path:
        if current is None or not isinstance(current, dict):
            return None
        current = current.get(key)
    return current


def _extract_raw(value: object) -> Optional[float]:
    if isinstance(value, dict):
        if "raw" in value:
            return _safe_float(value.get("raw"))
        if "fmt" in value:
            return _safe_float(value.get("fmt"))
    return _safe_float(value)


def _safe_float(value: object | None) -> Optional[float]:
    if value is None:
        return None
    try:
        result = float(value)
    except (TypeError, ValueError):
        return None
    if math.isnan(result):
        return None
    return result


def _clamp(value: float, lower: float, upper: float) -> float:
    return max(lower, min(upper, value))




def _cashflow_statements(data: dict | None) -> list[dict]:
    statements = _deep_get(data or {}, "cashflowStatementHistory", "cashflowStatements")
    if isinstance(statements, list):
        return [s for s in statements if isinstance(s, dict)]
    return []


def _balance_sheet_statements(data: dict | None) -> list[dict]:
    statements = _deep_get(data or {}, "balanceSheetHistory", "balanceSheetStatements")
    if isinstance(statements, list):
        return [s for s in statements if isinstance(s, dict)]
    return []


def _income_statements(data: dict | None) -> list[dict]:
    statements = _deep_get(data or {}, "incomeStatementHistory", "incomeStatementHistory")
    if isinstance(statements, list):
        return [s for s in statements if isinstance(s, dict)]
    return []


def _latest_statement_value(statements: list[dict], key: str) -> Optional[float]:
    if not statements:
        return None
    for statement in statements:
        value = _extract_raw(statement.get(key))
        if value is not None:
            return value
    return None


def _compute_free_cash_flows(statements: list[dict]) -> list[float]:
    flows: list[float] = []
    for statement in statements:
        operating = _extract_raw(statement.get("totalCashFromOperatingActivities"))
        capex = _extract_raw(statement.get("capitalExpenditures"))
        if operating is None:
            continue
        capex = capex or 0.0
        flows.append(float(operating) + float(capex))
    return flows


def _estimate_growth(fcfs: list[float]) -> Optional[float]:
    positives = [fcf for fcf in fcfs if fcf > 0]
    if len(positives) < 2:
        return None
    latest = positives[0]
    oldest = positives[-1]
    periods = len(positives) - 1
    if latest <= 0 or oldest <= 0 or periods <= 0:
        return None
    cagr = (latest / oldest) ** (1 / periods) - 1
    return _clamp(float(cagr), -0.2, 0.25)


def _intrinsic_value(
    *,
    current_fcf: float,
    shares_outstanding: float,
    net_debt: float,
    growth_rate: Optional[float],
    discount_rate: float = 0.10,
    terminal_growth: float = 0.02,
    projection_years: int = 10,
) -> Optional[float]:
    if current_fcf <= 0 or shares_outstanding <= 0:
        return None
    growth = growth_rate if growth_rate is not None else 0.04
    growth = _clamp(growth, -0.05, 0.25)

    projected_fcf = current_fcf
    present_value = 0.0
    for year in range(1, projection_years + 1):
        projected_fcf *= 1 + growth
        present_value += projected_fcf / ((1 + discount_rate) ** year)
    terminal_cash_flow = projected_fcf * (1 + terminal_growth)
    if discount_rate <= terminal_growth:
        return None
    terminal_value = terminal_cash_flow / (discount_rate - terminal_growth)
    present_value += terminal_value / ((1 + discount_rate) ** projection_years)

    equity_value = present_value - net_debt
    if equity_value <= 0:
        return None
    return equity_value / shares_outstanding


def _intrinsic_buffett_dcf_per_share(
    *,
    fcf0: float,
    g: float,
    r: float,
    n: int,
    net_debt: float,
    shares: float,
) -> Optional[float]:
    if shares <= 0 or n <= 0 or fcf0 <= 0 or r <= g:
        return None
    growth_factor = 1 + g
    discount_factor = 1 + r
    try:
        pv_forecast = fcf0 * (growth_factor / (r - g)) * (1 - (growth_factor / discount_factor) ** n)
        pv_terminal = (fcf0 * (growth_factor ** (n + 1)) / (r - g)) / (discount_factor**n)
    except (OverflowError, ZeroDivisionError):
        return None
    enterprise_value = pv_forecast + pv_terminal
    equity_value = enterprise_value - net_debt
    if equity_value <= 0:
        return None
    return equity_value / shares


def _compute_enterprise_value(market_cap: Optional[float], net_debt: Optional[float]) -> Optional[float]:
    if market_cap is None:
        return None
    if net_debt is None:
        return market_cap
    return market_cap + net_debt


def _assign_rank(rows: list[OrderedDict], column: str) -> None:
    values = [(idx, row[column]) for idx, row in enumerate(rows) if row.get(column) is not None]
    values.sort(key=lambda item: item[1], reverse=True)
    last_value: Optional[float] = None
    last_rank = 0
    for position, (idx, value) in enumerate(values, start=1):
        if last_value is None or value != last_value:
            last_rank = position
            last_value = value
        rows[idx][f"{column}_rank"] = last_rank
    for row in rows:
        if row.get(f"{column}_rank") is None:
            row[f"{column}_rank"] = None


def _create_row(metric: ValuationMetrics) -> OrderedDict:
    row = OrderedDict()
    row["symbol"] = metric.symbol
    row["name"] = metric.name
    row["segment"] = metric.segment
    row["price"] = metric.price
    row["market_cap"] = metric.market_cap
    row["pe_ratio"] = metric.pe_ratio
    row["pb_ratio"] = metric.pb_ratio
    row["dividend_yield"] = metric.dividend_yield
    row["ebit"] = metric.ebit
    row["enterprise_value"] = metric.enterprise_value
    row["earnings_yield"] = metric.earnings_yield
    row["return_on_capital"] = metric.return_on_capital
    row["free_cash_flow"] = metric.free_cash_flow
    row["free_cash_flow_growth"] = metric.free_cash_flow_growth
    row["intrinsic_value"] = metric.intrinsic_value
    row["margin_of_safety"] = metric.margin_of_safety
    row["shares_outstanding"] = metric.shares_outstanding
    row["net_debt"] = metric.net_debt
    row["Intrinsic (BuffettDCF) kr/aktie"] = metric.buffett_intrinsic_value_per_share
    row["Buffett Undervärdering %"] = metric.buffett_undervaluation_pct
    row["buffett_growth_rate"] = metric.buffett_growth_rate
    row["buffett_discount_rate"] = metric.buffett_discount_rate
    row["buffett_projection_years"] = metric.buffett_projection_years
    row["notes"] = "; ".join(metric.notes)
    for column in _RANK_COLUMNS:
        row[column] = None
    return row


def metrics_to_rows(metrics: Iterable[ValuationMetrics]) -> list[OrderedDict]:
    rows = [_create_row(metric) for metric in metrics]
    if not rows:
        return rows
    _assign_rank(rows, "earnings_yield")
    _assign_rank(rows, "return_on_capital")
    for row in rows:
        ey_rank = row.get("earnings_yield_rank")
        roc_rank = row.get("return_on_capital_rank")
        if ey_rank is None or roc_rank is None:
            row["magic_formula_score"] = None
        else:
            row["magic_formula_score"] = ey_rank + roc_rank
    rows.sort(
        key=lambda row: (
            row.get("magic_formula_score") if row.get("magic_formula_score") is not None else float("inf"),
            -row.get("earnings_yield") if row.get("earnings_yield") is not None else float("inf"),
        )
    )
    return rows


def _download_quote_summary(symbol: str) -> dict:
    url = _YF_QUOTE_URL.format(symbol=parse.quote(symbol))
    payload = _http_get_json(url, {"modules": _YF_MODULES})
    result = _deep_get(payload, "quoteSummary", "result")
    if not isinstance(result, list) or not result:
        raise ValueError("Yahoo Finance response did not contain data")
    entry = result[0]
    if not isinstance(entry, dict):
        raise ValueError("Yahoo Finance response was malformed")
    return entry


def fetch_metrics(company: Company) -> ValuationMetrics:
    metrics = ValuationMetrics(symbol=company.symbol, name=company.name, segment=company.segment)

    try:
        data = _download_quote_summary(company.symbol)
    except Exception as exc:  # noqa: BLE001
        metrics.notes.append(f"quote summary error: {exc}")
        return metrics

    price_info = data.get("price", {}) if isinstance(data.get("price"), dict) else {}
    summary_detail = data.get("summaryDetail", {}) if isinstance(data.get("summaryDetail"), dict) else {}
    statistics = data.get("defaultKeyStatistics", {}) if isinstance(data.get("defaultKeyStatistics"), dict) else {}

    metrics.price = _extract_raw(_deep_get(price_info, "regularMarketPrice")) or _extract_raw(
        _deep_get(price_info, "regularMarketPreviousClose")
    )
    if metrics.price is None:
        metrics.price = _extract_raw(_deep_get(data.get("financialData", {}), "currentPrice"))

    metrics.market_cap = _extract_raw(_deep_get(price_info, "marketCap")) or _extract_raw(
        _deep_get(summary_detail, "marketCap")
    )
    metrics.pe_ratio = _extract_raw(_deep_get(summary_detail, "trailingPE")) or _extract_raw(
        _deep_get(statistics, "trailingPE")
    )
    metrics.pb_ratio = _extract_raw(_deep_get(statistics, "priceToBook"))
    raw_div_yield = _extract_raw(_deep_get(summary_detail, "dividendYield"))
    if raw_div_yield is not None and raw_div_yield > 1:
        raw_div_yield /= 100
    metrics.dividend_yield = raw_div_yield

    shares = _extract_raw(_deep_get(statistics, "sharesOutstanding")) or _extract_raw(
        _deep_get(price_info, "sharesOutstanding")
    )
    metrics.shares_outstanding = shares

    income_statements = _income_statements(data)
    metrics.ebit = _latest_statement_value(income_statements, "ebit")

    balance_statements = _balance_sheet_statements(data)
    total_debt = _latest_statement_value(balance_statements, "totalDebt")
    if total_debt is None:
        total_debt = _latest_statement_value(balance_statements, "shortLongTermDebt")
    cash = _latest_statement_value(balance_statements, "cashAndCashEquivalents")
    if cash is None:
        cash = _latest_statement_value(balance_statements, "cash")
    if total_debt is None and cash is None:
        metrics.net_debt = None
    else:
        metrics.net_debt = float((total_debt or 0.0) - (cash or 0.0))

    metrics.enterprise_value = _compute_enterprise_value(metrics.market_cap, metrics.net_debt)

    current_assets = _latest_statement_value(balance_statements, "totalCurrentAssets")
    current_liabilities = _latest_statement_value(balance_statements, "totalCurrentLiabilities")
    working_capital = None
    if current_assets is not None and current_liabilities is not None:
        working_capital = float(current_assets - current_liabilities)

    ppe = _latest_statement_value(balance_statements, "propertyPlantEquipment")
    if working_capital is not None and ppe is not None and metrics.ebit not in (None, 0):
        capital_employed = working_capital + ppe
        if capital_employed != 0:
            metrics.return_on_capital = metrics.ebit / capital_employed

    if metrics.ebit is not None and metrics.enterprise_value not in (None, 0):
        metrics.earnings_yield = metrics.ebit / metrics.enterprise_value

    cashflows = _cashflow_statements(data)
    fcfs = _compute_free_cash_flows(cashflows)
    if fcfs:
        metrics.free_cash_flow = fcfs[0]
        metrics.free_cash_flow_growth = _estimate_growth(fcfs)
    else:
        metrics.notes.append("no free cash flow data")

    if metrics.free_cash_flow is not None and metrics.shares_outstanding:
        intrinsic = _intrinsic_value(
            current_fcf=metrics.free_cash_flow,
            shares_outstanding=metrics.shares_outstanding,
            net_debt=metrics.net_debt or 0.0,
            growth_rate=metrics.free_cash_flow_growth,
        )
        metrics.intrinsic_value = intrinsic
        if intrinsic and metrics.price:
            metrics.margin_of_safety = (intrinsic - metrics.price) / metrics.price

    if metrics.free_cash_flow not in (None, 0) and metrics.shares_outstanding:
        default_discount_rate = 0.10
        default_projection_years = 10
        default_growth_rate = 0.04
        growth_rate = metrics.free_cash_flow_growth if metrics.free_cash_flow_growth is not None else default_growth_rate
        if growth_rate is not None:
            growth_rate = _clamp(growth_rate, -0.05, 0.15)
        metrics.buffett_growth_rate = growth_rate
        metrics.buffett_discount_rate = default_discount_rate
        metrics.buffett_projection_years = default_projection_years
        if growth_rate is not None and growth_rate >= default_discount_rate:
            metrics.notes.append("buffett dcf unavailable (growth >= discount rate)")
        else:
            intrinsic_buffett = _intrinsic_buffett_dcf_per_share(
                fcf0=float(metrics.free_cash_flow),
                g=growth_rate if growth_rate is not None else default_growth_rate,
                r=default_discount_rate,
                n=default_projection_years,
                net_debt=float(metrics.net_debt or 0.0),
                shares=float(metrics.shares_outstanding),
            )
            metrics.buffett_intrinsic_value_per_share = intrinsic_buffett
            if intrinsic_buffett is not None and metrics.price not in (None, 0):
                metrics.buffett_undervaluation_pct = (intrinsic_buffett - metrics.price) / metrics.price

    return metrics
