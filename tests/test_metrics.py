import math
import unittest

from aktiescanner.metrics import (
    ValuationMetrics,
    _estimate_growth,
    _intrinsic_buffett_dcf_per_share,
    _intrinsic_value,
    metrics_to_rows,
)


class MetricsMathTest(unittest.TestCase):
    def test_intrinsic_value_matches_discounted_cash_flow(self) -> None:
        intrinsic = _intrinsic_value(
            current_fcf=450_000_000,
            shares_outstanding=15_000_000,
            net_debt=200_000_000,
            growth_rate=0.06,
            discount_rate=0.10,
            terminal_growth=0.02,
            projection_years=10,
        )
        # Hand-calculated using spreadsheet
        expected = 496.8563255522884
        self.assertIsNotNone(intrinsic)
        self.assertTrue(math.isclose(intrinsic, expected, rel_tol=1e-4))

    def test_buffett_dcf_per_share_respects_formula(self) -> None:
        intrinsic = _intrinsic_buffett_dcf_per_share(
            fcf0=95_000_000,
            g=0.03,
            r=0.09,
            n=10,
            net_debt=150_000_000,
            shares=12_500_000,
        )
        expected = 118.46666666666664
        self.assertIsNotNone(intrinsic)
        self.assertTrue(math.isclose(intrinsic, expected, rel_tol=1e-6))

    def test_buffett_dcf_returns_none_when_discount_rate_too_low(self) -> None:
        self.assertIsNone(
            _intrinsic_buffett_dcf_per_share(
                fcf0=10.0,
                g=0.08,
                r=0.08,
                n=5,
                net_debt=0.0,
                shares=1.0,
            )
        )

    def test_growth_estimation_skips_negative_flows(self) -> None:
        growth = _estimate_growth([150.0, 120.0, 90.0, 110.0, 130.0])
        self.assertIsNotNone(growth)
        self.assertTrue(math.isclose(growth, 0.03642284375593974, rel_tol=1e-9))

    def test_magic_formula_ranking_is_deterministic(self) -> None:
        rows = metrics_to_rows(
            [
                ValuationMetrics(symbol="AAA", name="A", segment="Test", earnings_yield=0.12, return_on_capital=0.10),
                ValuationMetrics(symbol="BBB", name="B", segment="Test", earnings_yield=0.15, return_on_capital=0.06),
                ValuationMetrics(symbol="CCC", name="C", segment="Test", earnings_yield=0.05, return_on_capital=0.14),
            ]
        )
        first = rows[0]
        self.assertEqual(first["symbol"], "BBB")
        self.assertEqual(first["earnings_yield_rank"], 1)
        self.assertEqual(first["return_on_capital_rank"], 3)
        self.assertEqual(first["magic_formula_score"], 4)
        self.assertEqual(rows[1]["symbol"], "AAA")
        self.assertEqual(rows[2]["symbol"], "CCC")


if __name__ == "__main__":
    unittest.main()
