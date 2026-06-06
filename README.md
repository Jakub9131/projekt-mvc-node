DeskZone - System Rezerwacji Przestrzeni Biurowych

Opis funkcjonalnoœci aplikacji
DeskZone to nowoczesna aplikacja webowa typu SaaS, zbudowana w architekturze MVC (Model-View-Controller), s³u¿¹ca do kompleksowego zarz¹dzania zasobami biurowymi oraz rezerwacjami sal konferencyjnych w strukturze korporacyjnej.

G³ówne funkcjonalnoœci systemu:
  *System Autoryzacji (Auth): Logowanie i rejestracja u¿ytkowników z szyfrowaniem hase³ algorytmem `bcrypt` oraz walidacj¹ si³y has³a na backendzie. Obs³uga sesji u¿ytkownika (`express-session`).
  *Zarz¹dzanie Salami (CRUD): Pracownicy mog¹ przegl¹daæ dostêpne sale i filtrowaæ je dynamicznie po miastach.
  *Administrator posiada pe³ne uprawnienia do dodawania nowej sali, edycji istniej¹cej (okno modalne) oraz jej bezwzglêdnego usuwania.
Zaawansowany System Rezerwacji:
  *Rezerwacje mo¿liwe s¹ wy³¹cznie w godzinach otwarcia biura (07:00 - 23:00) na czas od 1 do 12 godzin.
  *Pracownik mo¿e samodzielnie anulowaæ swoj¹ rezerwacjê najpóŸniej na 48 godzin przed jej rozpoczêciem.
  *Algorytm Anti-Overlapping: Pancerna ochrona przed nak³adaniem siê rezerwacji w bazie danych PostgreSQL przy u¿yciu operacji na przedzia³ach czasowych.
Panel Administratora (Zarz¹dzanie zasobami i ludŸmi):
  *Mo¿liwoœæ rezerwowania sal w imieniu dowolnego pracownika.
  *Modyfikacja i edycja rezerwacji pracowników (z automatycznym powiadomieniem systemowym).
  *Usuwanie rezerwacji z podaniem powodu, który jest przesy³any do poszkodowanego u¿ytkownika.
  *Pe³ne operacje CRUD na kontach u¿ytkowników (tworzenie, edycja, usuwanie pracowników).
System Powiadomieñ i Statystyk: Dynamiczne powiadomienia o odwo³anych spotkaniach oraz zaawansowane statystyki wykorzystania sal (TOP 5).

---

Instrukcja uruchomienia aplikacji 
Wymagania systemowe:
* Zainstalowane œrodowisko Node.js 
* Dostêp do bazy danych  PostgreSQL

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
4. npm run dev (na chwile, tak ¿eby baza danych pobra³a tabele)
5. node run-seed.js (wgranie danych testowych)
6. npm start
