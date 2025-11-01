
def las_tal(prompt):
    while True:
        s = input(prompt).strip()
        if s.lower() == "stop":
            return "stop"
        try:
            return float(s.replace(",", "."))
        except ValueError:
            print("⚠️  Inte ett tal. Försök igen eller skriv 'stop' för att avsluta.")

def skriv_resultat(a, b):
    print(f"\nResultat för a={a} och b={b}:")
    print(f"  Summa:       {a + b}")
    print(f"  Differens:   {a - b}")
    print(f"  Produkt:     {a * b}")
    if b == 0:
        print("  Kvot:        går inte att beräkna (delning med 0)")
    else:
        print(f"  Kvot:        {a / b}")
    print()

def main():
    print("Miniräknare. Mata tal eller skriv 'stop' för att avsluta.\n")
    while True:
        a = las_tal("Ange första talet (a): ")
        if a == "stop":
            break
        b = las_tal("Ange andra talet (b): ")
        if b == "stop":
            break
        skriv_resultat(a, b)
    print("\nHejdå!")

if __name__ == "__main__":
    main()
