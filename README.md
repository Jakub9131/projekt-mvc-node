DeskZone - System Rezerwacji Przestrzeni Biurowych

Opis funkcjonalności aplikacji
DeskZone to nowoczesna aplikacja webowa typu SaaS, zbudowana w architekturze MVC (Model-View-Controller), służąca do kompleksowego zarządzania zasobami biurowymi oraz rezerwacjami sal konferencyjnych w strukturze korporacyjnej.

Główne funkcjonalności systemu:
  *System Autoryzacji (Auth): Logowanie i rejestracja użytkowników z szyfrowaniem haseł algorytmem `bcrypt` oraz walidacją siły hasła na backendzie. Obsługa sesji użytkownika (`express-session`).
  *Zarządzanie Salami (CRUD): Pracownicy mogą przeglądać dostępne sale i filtrować je dynamicznie po miastach.
  *Administrator posiada pełne uprawnienia do dodawania nowej sali, edycji istniejącej (okno modalne) oraz jej bezwzględnego usuwania.
Zaawansowany System Rezerwacji:
  *Rezerwacje możliwe są wyłącznie w godzinach otwarcia biura (07:00 - 23:00) na czas od 1 do 12 godzin.
  *Pracownik może samodzielnie anulować swoją rezerwację najpóźniej na 48 godzin przed jej rozpoczęciem.
  *Algorytm Anti-Overlapping: Pancerna ochrona przed nakładaniem się rezerwacji w bazie danych PostgreSQL przy użyciu operacji na przedziałach czasowych.
Panel Administratora (Zarządzanie zasobami i ludźmi):
  *Możliwość rezerwowania sal w imieniu dowolnego pracownika.
  *Modyfikacja i edycja rezerwacji pracowników (z automatycznym powiadomieniem systemowym).
  *Usuwanie rezerwacji z podaniem powodu, który jest przesyłany do poszkodowanego użytkownika.
  *Pełne operacje CRUD na kontach użytkowników (tworzenie, edycja, usuwanie pracowników).
System Powiadomień i Statystyk: Dynamiczne powiadomienia o odwołanych spotkaniach oraz zaawansowane statystyki wykorzystania sal (TOP 5).

---

Instrukcja uruchomienia aplikacji 
Wymagania systemowe:
* Zainstalowane środowisko Node.js 
* Dostęp do bazy danych  PostgreSQL

Krok po kroku:

1. Przygotowanie bazy danych w PostreSQL
2. Instalacja Node.js (Instalacja pakientow Node 'npm install'
3. Przygotowanie pliku .env 
PORT=3000
DB_NAME='NAZWA BAZY DANYCH'
DB_USER='UZYTKOWNIK'
DB_PASSWORD='HASLO'
DB_HOST=localhost
DB_DIALECT=postgres
4. npm run dev (na chwile, tak żeby baza danych pobrała tabele)
5. node run-seed.js (wgranie danych testowych)
6. npm start
