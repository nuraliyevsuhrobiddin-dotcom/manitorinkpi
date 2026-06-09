export const CONSTANTS = {
  "FACULTIES": [
    { "id": 1, "name": "Pedagogika" },
    { "id": 2, "name": "Filologiya" },
    { "id": 3, "name": "Ijtimoiy fanlar" }
  ],
  "DEPARTMENTS": [
    { "id": 1, "name": "Pedagogika", "facultyId": 1 },
    { "id": 2, "name": "Tabiiy fanlar", "facultyId": 1 },
    { "id": 3, "name": "Boshlang‘ich ta’lim metodikasi", "facultyId": 1 },
    { "id": 4, "name": "Boshlang‘ich ta’lim nazariyasi", "facultyId": 1 },
    { "id": 5, "name": "Maktabgacha ta’lim", "facultyId": 1 },
    { "id": 6, "name": "Matematika va ta’limda axborot texnologiyalari", "facultyId": 1 },
    { "id": 7, "name": "Til va adabiyot", "facultyId": 2 },
    { "id": 8, "name": "Xorijiy til nazariyasi va amaliyoti", "facultyId": 2 },
    { "id": 9, "name": "Ijtimoiy fanlar", "facultyId": 3 },
    { "id": 10, "name": "Tarix", "facultyId": 3 },
    { "id": 11, "name": "Geografiya", "facultyId": 3 },
    { "id": 12, "name": "San’atshunoslik", "facultyId": 3 },
    { "id": 13, "name": "Jismoniy madaniyat", "facultyId": 3 }
  ],
  "DIVISIONS": [],
  "POSITIONS": [
    "Stajor o‘qituvchi",
    "Assistent",
    "O‘qituvchi",
    "Katta o‘qituvchi",
    "Dotsent",
    "Professor",
    "Kafedra mudiri"
  ],
  "EMPLOYMENT_TYPES": [
    "Asosiy",
    "Ichki o‘rindosh",
    "Tashqi o‘rindosh"
  ],
  "PROJECT_TYPES": [
    "Loyiha",
    "Startap",
    "Grant",
    "Spinoff"
  ],
  "PROJECT_DIRECTIONS": [
    "Innovatsion",
    "Amaliy",
    "Fundamental"
  ],
  "PROJECT_LEADER_POSITIONS": [
    "Professor-o‘qituvchi",
    "Ilmiy xodim",
    "Talaba"
  ],
  "PROJECT_DURATIONS": [1, 2, 3, 4],
  "PROJECTS": [
    { "id": 1, "name": "Kvant hisoblashlar uchun yangi algoritmlar", "type": "Loyiha", "direction": "Fundamental", "leaderName": "Karimov Ali Valiyevich", "leaderPosition": "Professor-o‘qituvchi", "departmentId": 6, "facultyId": 1, "totalFunding": 500, "duration": 3 },
    { "id": 2, "name": "Maktabgacha ta'limda raqamli pedagogika", "type": "Loyiha", "direction": "Amaliy", "leaderName": "Usmonova Sevara Karimovna", "leaderPosition": "Professor-o‘qituvchi", "departmentId": 5, "facultyId": 1, "totalFunding": 250, "duration": 2 },
    { "id": 3, "name": "O'zbek adabiyotining yangi qirralari", "type": "Loyiha", "direction": "Innovatsion", "leaderName": "Qosimov Javohir Erkinovich", "leaderPosition": "Professor-o‘qituvchi", "departmentId": 7, "facultyId": 2, "totalFunding": 150, "duration": 1 },
    { "id": 4, "name": "EduAI - Sun'iy intellektli repetitor", "type": "Startap", "direction": "Innovatsion", "leaderName": "Sodiqov Anvar", "leaderPosition": "Talaba", "departmentId": 6, "facultyId": 1, "totalFunding": 50, "duration": 1 },
    { "id": 5, "name": "Erasmus+ xalqaro grant", "type": "Grant", "direction": "Amaliy", "leaderName": "Nazarova Laylo Anvarovna", "leaderPosition": "Professor-o‘qituvchi", "departmentId": 7, "facultyId": 2, "totalFunding": 1200, "duration": 4 },
    { "id": 6, "name": "Pedagogika Tech Spinoff", "type": "Spinoff", "direction": "Innovatsion", "leaderName": "Abdullayeva Madina Zokirovna", "leaderPosition": "Professor-o‘qituvchi", "departmentId": 1, "facultyId": 1, "totalFunding": 80, "duration": 2 }
  ],
  "PROFESSORS": [
    { "id": 1, "lastName": "Karimov", "firstName": "Ali", "patronymic": "Valiyevich", "birthDate": "1975-03-15", "gender": "erkak", "departmentId": 4, "degree": "DSc", "title": "Professor", "position": "Kafedra mudiri", "staffUnit": 1, "employmentType": "Asosiy", "phone": "+998901234567" },
    { "id": 2, "lastName": "Valiyeva", "firstName": "Nodira", "patronymic": "Alisherovna", "birthDate": "1980-11-20", "gender": "ayol", "departmentId": 4, "degree": "PhD", "title": "Dotsent", "position": "Professor", "staffUnit": 1, "employmentType": "Asosiy", "phone": "+998902345678" },
    { "id": 3, "lastName": "Sobirov", "firstName": "Sanjar", "patronymic": "Bahodirovich", "birthDate": "1982-07-01", "gender": "erkak", "departmentId": 3, "degree": "PhD", "title": "Dotsent", "position": "Dotsent", "staffUnit": 0.75, "employmentType": "Asosiy", "phone": "+998903456789" },
    { "id": 4, "lastName": "Nazarova", "firstName": "Laylo", "patronymic": "Anvarovna", "birthDate": "1988-09-05", "gender": "ayol", "departmentId": 7, "degree": "PhD", "title": "Yo‘q", "position": "Katta o‘qituvchi", "staffUnit": 1, "employmentType": "Asosiy", "phone": "+998904567890" },
    { "id": 5, "lastName": "Qosimov", "firstName": "Javohir", "patronymic": "Erkinovich", "birthDate": "1972-01-25", "gender": "erkak", "departmentId": 7, "degree": "DSc", "title": "Professor", "position": "Professor", "staffUnit": 1, "employmentType": "Asosiy", "phone": "+998905678901" },
    { "id": 6, "lastName": "Azizova", "firstName": "Gulnora", "patronymic": "Rustamovna", "birthDate": "1995-04-12", "gender": "ayol", "departmentId": 8, "degree": "Yo‘q", "title": "Yo‘q", "position": "Assistent", "staffUnit": 0.5, "employmentType": "Ichki o‘rindosh", "phone": "+998906789012" },
    { "id": 7, "lastName": "Teshayev", "firstName": "Ulugbek", "patronymic": "Nematovich", "birthDate": "1981-06-30", "gender": "erkak", "departmentId": 9, "degree": "PhD", "title": "Dotsent", "position": "Kafedra mudiri", "staffUnit": 1, "employmentType": "Asosiy", "phone": "+998907890123" },
    { "id": 8, "lastName": "Yuldashev", "firstName": "Timur", "patronymic": "Olimovich", "birthDate": "1968-08-19", "gender": "erkak", "departmentId": 10, "degree": "DSc", "title": "Professor", "position": "Professor", "staffUnit": 1, "employmentType": "Asosiy", "phone": "+998908901234" },
    { "id": 9, "lastName": "Abdullayeva", "firstName": "Madina", "patronymic": "Zokirovna", "birthDate": "1990-02-28", "gender": "ayol", "departmentId": 1, "degree": "PhD", "title": "Yo‘q", "position": "Katta o‘qituvchi", "staffUnit": 1, "employmentType": "Asosiy", "phone": "+998909012345" },
    { "id": 10, "lastName": "Saidov", "firstName": "Aziz", "patronymic": "Botirivich", "birthDate": "1985-05-14", "gender": "erkak", "departmentId": 2, "degree": "PhD", "title": "Dotsent", "position": "Dotsent", "staffUnit": 1, "employmentType": "Asosiy", "phone": "+998911234567" },
    { "id": 11, "lastName": "Usmonova", "firstName": "Sevara", "patronymic": "Karimovna", "birthDate": "1979-12-01", "gender": "ayol", "departmentId": 5, "degree": "PhD", "title": "Dotsent", "position": "Kafedra mudiri", "staffUnit": 1, "employmentType": "Asosiy", "phone": "+998912345678" },
    { "id": 12, "lastName": "Hakimov", "firstName": "Sardor", "patronymic": "Sobirovich", "birthDate": "1992-10-10", "gender": "erkak", "departmentId": 6, "degree": "Yo‘q", "title": "Yo‘q", "position": "O‘qituvchi", "staffUnit": 1, "employmentType": "Tashqi o‘rindosh", "phone": "+998913456789" },
    { "id": 13, "lastName": "Ibragimova", "firstName": "Dilnoza", "patronymic": "Nazarovna", "birthDate": "1983-01-08", "gender": "ayol", "departmentId": 11, "degree": "PhD", "title": "Yo‘q", "position": "Dotsent", "staffUnit": 0.75, "employmentType": "Asosiy", "phone": "+998914567890" },
    { "id": 14, "lastName": "Zokirov", "firstName": "Oybek", "patronymic": "Qosimovich", "birthDate": "1977-04-22", "gender": "erkak", "departmentId": 12, "degree": "DSc", "title": "Professor", "position": "Professor", "staffUnit": 1, "employmentType": "Asosiy", "phone": "+998915678901" },
    { "id": 15, "lastName": "Qodirova", "firstName": "Zarina", "patronymic": "Azizovna", "birthDate": "1998-07-17", "gender": "ayol", "departmentId": 13, "degree": "Yo‘q", "title": "Yo‘q", "position": "Assistent", "staffUnit": 1, "employmentType": "Asosiy", "phone": "+998916789012" },
    { "id": 16, "lastName": "Rahmatov", "firstName": "Vali", "patronymic": "Ulugbekovich", "birthDate": "1986-02-11", "gender": "erkak", "departmentId": 1, "degree": "PhD", "title": "Yo‘q", "position": "Katta o‘qituvchi", "staffUnit": 1, "employmentType": "Asosiy", "phone": "+998931234567" },
    { "id": 17, "lastName": "Kamalova", "firstName": "Kamola", "patronymic": "Timurovna", "birthDate": "1970-09-23", "gender": "ayol", "departmentId": 2, "degree": "DSc", "title": "Professor", "position": "Kafedra mudiri", "staffUnit": 1, "employmentType": "Asosiy", "phone": "+998932345678" },
    { "id": 18, "lastName": "Sultanov", "firstName": "Sanjar", "patronymic": "Sardorovich", "birthDate": "1991-11-30", "gender": "erkak", "departmentId": 3, "degree": "Yo‘q", "title": "Yo‘q", "position": "Assistent", "staffUnit": 1, "employmentType": "Asosiy", "phone": "+998933456789" },
    { "id": 19, "lastName": "Ganiyeva", "firstName": "Shahnoza", "patronymic": "Oybekovna", "birthDate": "1984-06-15", "gender": "ayol", "departmentId": 8, "degree": "PhD", "title": "Dotsent", "position": "Dotsent", "staffUnit": 1, "employmentType": "Asosiy", "phone": "+998934567890" },
    { "id": 20, "lastName": "Mannopov", "firstName": "Javohir", "patronymic": "Valiyevich", "birthDate": "1976-12-25", "gender": "erkak", "departmentId": 10, "degree": "PhD", "title": "Dotsent", "position": "Kafedra mudiri", "staffUnit": 1, "employmentType": "Asosiy", "phone": "+998935678901" }
  ],
  "PLANS": [
    { "professorId": 1, "year": 2026, "planItems": [{ "type": "publication", "subType": "Scopus Q1", "count": 1 }, { "type": "supervision", "subType": "DSc rahbarlik", "count": 1 }, { "type": "methodological_work", "subType": "Darslik", "count": 1 }] },
    { "professorId": 2, "year": 2026, "planItems": [{ "type": "publication", "subType": "Scopus Q2", "count": 2 }, { "type": "methodological_work", "subType": "Monografiya", "count": 1 }] },
    { "professorId": 3, "year": 2026, "planItems": [{ "type": "publication", "subType": "Scopus Q3", "count": 1 }, { "type": "international_activity", "subType": "Xorijiy stajirovka", "count": 1 }] },
    { "professorId": 4, "year": 2026, "planItems": [{ "type": "publication", "subType": "Xalqaro konferensiya", "count": 2 }, { "type": "intellectual_property", "subType": "DGU", "count": 2 }] },
    { "professorId": 5, "year": 2026, "planItems": [{ "type": "project", "subType": "Bajarilayotgan xalqaro loyiha", "count": 1 }, { "type": "supervision", "subType": "DSc rahbarlik", "count": 1 }] },
    { "professorId": 6, "year": 2026, "planItems": [{ "type": "student_achievement", "subType": "Respublika tanlovi 1-o‘rin", "count": 2 }, { "type": "publication", "subType": "OAK respublika", "count": 3 }] },
    { "professorId": 7, "year": 2026, "planItems": [{ "type": "publication", "subType": "Scopus Q2", "count": 1 }, { "type": "methodological_work", "subType": "Monografiya", "count": 1 }] },
    { "professorId": 8, "year": 2026, "planItems": [{ "type": "publication", "subType": "Scopus Q1", "count": 2 }] },
    { "professorId": 9, "year": 2026, "planItems": [{ "type": "supervision", "subType": "PhD rahbarlik", "count": 2 }, { "type": "publication", "subType": "OAK xalqaro", "count": 2 }] },
    { "professorId": 10, "year": 2026, "planItems": [{ "type": "publication", "subType": "Scopus Q3", "count": 2 }, { "type": "intellectual_property", "subType": "Patent", "count": 1 }] },
    { "professorId": 11, "year": 2026, "planItems": [{ "type": "methodological_work", "subType": "Darslik", "count": 1 }, { "type": "publication", "subType": "Scopus Q4", "count": 2 }] },
    { "professorId": 12, "year": 2026, "planItems": [{ "type": "project", "subType": "Davlat granti arizasi", "count": 3 }, { "type": "publication", "subType": "OAK respublika", "count": 2 }] },
    { "professorId": 13, "year": 2026, "planItems": [{ "type": "international_activity", "subType": "Xorijiy professor jalb qilish", "count": 1 }, { "type": "publication", "subType": "Scopus Q3", "count": 1 }] },
    { "professorId": 14, "year": 2026, "planItems": [{ "type": "supervision", "subType": "Kengash a’zoligi", "count": 1 }, { "type": "publication", "subType": "Scopus Q1", "count": 1 }] },
    { "professorId": 15, "year": 2026, "planItems": [{ "type": "student_achievement", "subType": "Xalqaro tanlov 1-o‘rin", "count": 1 }, { "type": "publication", "subType": "Xalqaro konferensiya", "count": 2 }] },
    { "professorId": 16, "year": 2026, "planItems": [{ "type": "publication", "subType": "Scopus Q4", "count": 2 }, { "type": "methodological_work", "subType": "O‘quv qo‘llanma", "count": 1 }] },
    { "professorId": 17, "year": 2026, "planItems": [{ "type": "publication", "subType": "Scopus Q2", "count": 1 }, { "type": "project", "subType": "Bajarilayotgan davlat loyihasi", "count": 1 }] },
    { "id": 18, "professorId": 18, "year": 2026, "planItems": [{ "type": "publication", "subType": "OAK respublika", "count": 4 }] },
    { "id": 19, "professorId": 19, "year": 2026, "planItems": [{ "type": "publication", "subType": "Scopus Q3", "count": 1 }, { "type": "supervision", "subType": "PhD rahbarlik", "count": 1 }] },
    { "id": 20, "professorId": 20, "year": 2026, "planItems": [{ "type": "publication", "subType": "Scopus Q2", "count": 1 }, { "type": "methodological_work", "subType": "Monografiya", "count": 1 }] }
  ],
  "ACHIEVEMENTS": [
    { "id": 1, "professorId": 1, "year": 2026, "quarter": 1, "type": "publication", "subType": "Scopus Q1", "count": 1 },
    { "id": 2, "professorId": 2, "year": 2026, "quarter": 1, "type": "publication", "subType": "OAK respublika", "count": 2 },
    { "id": 3, "professorId": 3, "year": 2026, "quarter": 1, "type": "publication", "subType": "Scopus Q3", "count": 1 },
    { "id": 4, "professorId": 4, "year": 2026, "quarter": 1, "type": "intellectual_property", "subType": "DGU", "count": 3 },
    { "id": 5, "professorId": 5, "year": 2026, "quarter": 1, "type": "project", "subType": "Bajarilayotgan xalqaro loyiha", "count": 1 },
    { "id": 6, "professorId": 6, "year": 2026, "quarter": 1, "type": "student_achievement", "subType": "Respublika tanlovi 1-o‘rin", "count": 1 },
    { "id": 7, "professorId": 7, "year": 2026, "quarter": 1, "type": "methodological_work", "subType": "Monografiya", "count": 1 },
    { "id": 8, "professorId": 8, "year": 2026, "quarter": 1, "type": "publication", "subType": "Scopus Q1", "count": 1 },
    { "id": 9, "professorId": 9, "year": 2026, "quarter": 1, "type": "supervision", "subType": "PhD rahbarlik", "count": 1 },
    { "id": 10, "professorId": 10, "year": 2026, "quarter": 1, "type": "publication", "subType": "Scopus Q3", "count": 1 },
    { "id": 11, "professorId": 1, "year": 2026, "quarter": 2, "type": "supervision", "subType": "PhD rahbarlik", "count": 1 },
    { "id": 12, "professorId": 2, "year": 2026, "quarter": 2, "type": "methodological_work", "subType": "O‘quv qo‘llanma", "count": 1 },
    { "id": 13, "professorId": 3, "year": 2026, "quarter": 2, "type": "international_activity", "subType": "Xorijiy stajirovka", "count": 1 },
    { "id": 14, "professorId": 4, "year": 2026, "quarter": 2, "type": "Xalqaro konferensiya", "subType": "publication", "count": 2 },
    { "id": 15, "professorId": 5, "year": 2026, "quarter": 2, "type": "supervision", "subType": "DSc rahbarlik", "count": 1 }
  ],
  "SCORING_SYSTEM": {
    "publication": {
      "Scopus Q1": { "score": 15, "description": "Scopus bazasidagi Q1 jurnallaridagi maqola" },
      "Scopus Q2": { "score": 12, "description": "Scopus bazasidagi Q2 jurnallaridagi maqola" },
      "Scopus Q3": { "score": 10, "description": "Scopus bazasidagi Q3 jurnallaridagi maqola" },
      "Scopus Q4": { "score": 8, "description": "Scopus bazasidagi Q4 jurnallaridagi maqola" },
      "OAK respublika": { "score": 3, "description": "OAK ro'yxatidagi respublika jurnallaridagi maqola" },
      "OAK xalqaro": { "score": 3, "description": "OAK ro'yxatidagi xalqaro jurnallardagi maqola" },
      "Xalqaro konferensiya": { "score": 6, "description": "Xalqaro miqyosdagi konferensiya materiallaridagi maqola" }
    },
    "intellectual_property": {
      "Patent": { "score": 10, "description": "Ixtiro uchun olingan patent" },
      "DGU": { "score": 2, "description": "Dasturiy mahsulot uchun guvohnoma" }
    },
    "methodological_work": {
      "Darslik": { "score": 8, "description": "Nashr etilgan darslik" },
      "Monografiya": { "score": 6, "description": "Nashr etilgan monografiya" },
      "O‘quv qo‘llanma": { "score": 4, "description": "Nashr etilgan o'quv qo'llanma" }
    },
    "project": {
      "Bajarilayotgan xalqaro loyiha": { "score": 20, "description": "Rahbarlik qilinayotgan xalqaro ilmiy loyiha" },
      "Bajarilayotgan davlat loyihasi": { "score": 15, "description": "Rahbarlik qilinayotgan davlat ilmiy loyihasi" },
      "Xalqaro grant arizasi": { "score": 5, "description": "Topshirilgan xalqaro grant arizasi" },
      "Davlat granti arizasi": { "score": 5, "description": "Topshirilgan davlat granti arizasi" }
    },
    "international_activity": {
      "Xorijiy stajirovka": { "score": 10, "description": "Xorijiy mamlakatlarda o'tilgan malaka oshirish yoki stajirovka" },
      "Xorijiy professor jalb qilish": { "score": 5, "description": "O'quv jarayoniga xorijiy professor yoki mutaxassisni jalb qilish" }
    },
    "student_achievement": {
      "Xalqaro tanlov 1-o‘rin": { "score": 6, "description": "Talabaning xalqaro tanlovdagi 1-o'rin g'olibligi" },
      "Xalqaro tanlov 2-o‘rin": { "score": 5, "description": "Talabaning xalqaro tanlovdagi 2-o'rin g'olibligi" },
      "Xalqaro tanlov 3-o‘rin": { "score": 4, "description": "Talabaning xalqaro tanlovdagi 3-o'rin g'olibligi" },
      "Respublika tanlovi 1-o‘rin": { "score": 3, "description": "Talabaning respublika tanlovidagi 1-o'rin g'olibligi" },
      "Respublika tanlovi 2-o‘rin": { "score": 2, "description": "Talabaning respublika tanlovidagi 2-o'rin g'olibligi" },
      "Respublika tanlovi 3-o‘rin": { "score": 1, "description": "Talabaning respublika tanlovidagi 3-o'rin g'olibligi" }
    },
    "supervision": {
      "DSc rahbarlik": { "score": 15, "description": "DSc dissertatsiyasiga ilmiy rahbarlik" },
      "PhD rahbarlik": { "score": 10, "description": "PhD dissertatsiyasiga ilmiy rahbarlik" },
      "Kengash a’zoligi": { "score": 10, "description": "Ilmiy kengash a'zoligi" },
      "Seminar a’zoligi": { "score": 5, "description": "Ilmiy seminar a'zoligi" }
    },
    "thesis_defense": {
      "PhD": { "score": 1, "description": "PhD ilmiy darajasini olish" },
      "DSc": { "score": 1, "description": "DSc ilmiy darajasini olish" },
      "dotsentlik": { "score": 1, "description": "Dotsent ilmiy unvonini olish" },
      "professorlik": { "score": 1, "description": "Professor ilmiy unvonini olish" }
    }
  },
  "USERS": [
    { "id": 3, "username": "guest", "role": "guest" }
  ],
  "THESIS_DEFENSES": [
    { "id": 1, "lastName": "Alimov", "firstName": "Botir", "patronymic": "Karimovich", "departmentId": 1, "facultyId": 1, "specialty": "13.00.01 - Pedagogika nazariyasi. Pedagogik ta'limotlar tarixi", "type": "PhD", "fieldOfScience": "Pedagogika fanlari", "thesisTopic": "Zamonaviy ta'limda innovatsion metodlar", "supervisor": "Karimov A.V.", "defenseOrganization": "Nizomiy nomidagi TDPU", "councilNumber": "DSc.03/30.12.2019.Ped.01.02", "defenseDate": "2023-05-20" },
    { "id": 2, "lastName": "Salimova", "firstName": "Dildora", "patronymic": "Erkinovna", "departmentId": 7, "facultyId": 2, "specialty": "10.00.02 - O'zbek adabiyoti", "type": "DSc", "fieldOfScience": "Filologiya fanlari", "thesisTopic": "XX asr o'zbek she'riyatida modernizm", "supervisor": "Qosimov J.E.", "defenseOrganization": "O'zR FA O'zbek tili, adabiyoti va folklori instituti", "councilNumber": "DSc.02/30.12.2019.Fil.01.01", "defenseDate": "2024-01-15" }
  ],
  "SPECIALTIES": [
    "13.00.01 - Pedagogika nazariyasi. Pedagogik ta'limotlar tarixi",
    "10.00.02 - O'zbek adabiyoti",
    "07.00.01 - O'zbekiston tarixi"
  ],
  "FIELDS_OF_SCIENCE": [
    "Pedagogika fanlari",
    "Filologiya fanlari",
    "Tarix fanlari",
    "Fizika-matematika fanlari",
    "Iqtisodiyot fanlari"
  ],
  "DEFENSE_TYPES": [
    "PhD",
    "DSc",
    "dotsent",
    "professor"
  ]
}
