export interface BankBranch {
  name: string;
  city: string;
}

export interface Bank {
  id: string;
  name: string;
  branches: BankBranch[];
}

export const SRI_LANKA_BANKS: Bank[] = [
  // ─────────────────────────────────────────────────────────────────────────
  // BANK OF CEYLON
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'boc',
    name: 'Bank of Ceylon',
    branches: [
      // Colombo District
      { name: 'Colombo Fort', city: 'Colombo' },
      { name: 'Pettah', city: 'Colombo' },
      { name: 'Maradana', city: 'Colombo' },
      { name: 'Borella', city: 'Colombo' },
      { name: 'Bambalapitiya', city: 'Colombo' },
      { name: 'Wellawatte', city: 'Colombo' },
      { name: 'Dehiwala', city: 'Colombo' },
      { name: 'Mount Lavinia', city: 'Colombo' },
      { name: 'Nugegoda', city: 'Colombo' },
      { name: 'Maharagama', city: 'Colombo' },
      { name: 'Kottawa', city: 'Colombo' },
      { name: 'Homagama', city: 'Colombo' },
      { name: 'Piliyandala', city: 'Colombo' },
      { name: 'Moratuwa', city: 'Colombo' },
      { name: 'Ratmalana', city: 'Colombo' },
      { name: 'Kaduwela', city: 'Colombo' },
      { name: 'Malabe', city: 'Colombo' },
      { name: 'Rajagiriya', city: 'Colombo' },
      { name: 'Nawala', city: 'Colombo' },
      { name: 'Battaramulla', city: 'Colombo' },
      { name: 'Kotte', city: 'Colombo' },
      { name: 'Kollupitiya', city: 'Colombo' },
      { name: 'Grandpass', city: 'Colombo' },
      { name: 'Kotahena', city: 'Colombo' },
      { name: 'Mattakkuliya', city: 'Colombo' },
      { name: 'Kelaniya', city: 'Colombo' },
      { name: 'Wattala', city: 'Colombo' },
      { name: 'Ja-Ela', city: 'Colombo' },
      { name: 'Negombo', city: 'Negombo' },
      { name: 'Katunayake', city: 'Colombo' },
      { name: 'Minuwangoda', city: 'Colombo' },
      { name: 'Divulapitiya', city: 'Colombo' },
      // Kandy District
      { name: 'Kandy City', city: 'Kandy' },
      { name: 'Peradeniya', city: 'Kandy' },
      { name: 'Katugastota', city: 'Kandy' },
      { name: 'Gampola', city: 'Kandy' },
      { name: 'Nawalapitiya', city: 'Kandy' },
      { name: 'Akurana', city: 'Kandy' },
      { name: 'Digana', city: 'Kandy' },
      { name: 'Wattegama', city: 'Kandy' },
      { name: 'Kadugannawa', city: 'Kandy' },
      // Galle District
      { name: 'Galle', city: 'Galle' },
      { name: 'Hikkaduwa', city: 'Galle' },
      { name: 'Ambalangoda', city: 'Galle' },
      { name: 'Karapitiya', city: 'Galle' },
      { name: 'Elpitiya', city: 'Galle' },
      { name: 'Baddegama', city: 'Galle' },
      // Matara District
      { name: 'Matara', city: 'Matara' },
      { name: 'Weligama', city: 'Matara' },
      { name: 'Akuressa', city: 'Matara' },
      { name: 'Deniyaya', city: 'Matara' },
      { name: 'Kamburupitiya', city: 'Matara' },
      // Kurunegala District
      { name: 'Kurunegala', city: 'Kurunegala' },
      { name: 'Kuliyapitiya', city: 'Kurunegala' },
      { name: 'Narammala', city: 'Kurunegala' },
      { name: 'Pannala', city: 'Kurunegala' },
      { name: 'Nikaweratiya', city: 'Kurunegala' },
      { name: 'Wariyapola', city: 'Kurunegala' },
      { name: 'Mawathagama', city: 'Kurunegala' },
      // Gampaha District
      { name: 'Gampaha', city: 'Gampaha' },
      { name: 'Veyangoda', city: 'Gampaha' },
      { name: 'Mirigama', city: 'Gampaha' },
      { name: 'Nittambuwa', city: 'Gampaha' },
      { name: 'Ragama', city: 'Gampaha' },
      { name: 'Ganemulla', city: 'Gampaha' },
      // Kalutara District
      { name: 'Kalutara', city: 'Kalutara' },
      { name: 'Panadura', city: 'Kalutara' },
      { name: 'Horana', city: 'Kalutara' },
      { name: 'Aluthgama', city: 'Kalutara' },
      { name: 'Bandaragama', city: 'Kalutara' },
      { name: 'Beruwala', city: 'Kalutara' },
      // Ratnapura District
      { name: 'Ratnapura', city: 'Ratnapura' },
      { name: 'Embilipitiya', city: 'Ratnapura' },
      { name: 'Balangoda', city: 'Ratnapura' },
      { name: 'Pelmadulla', city: 'Ratnapura' },
      { name: 'Rakwana', city: 'Ratnapura' },
      // Kegalle District
      { name: 'Kegalle', city: 'Kegalle' },
      { name: 'Mawanella', city: 'Kegalle' },
      { name: 'Warakapola', city: 'Kegalle' },
      { name: 'Rambukkana', city: 'Kegalle' },
      // Nuwara Eliya District
      { name: 'Nuwara Eliya', city: 'Nuwara Eliya' },
      { name: 'Hatton', city: 'Nuwara Eliya' },
      { name: 'Talawakele', city: 'Nuwara Eliya' },
      { name: 'Kotagala', city: 'Nuwara Eliya' },
      // Badulla District
      { name: 'Badulla', city: 'Badulla' },
      { name: 'Bandarawela', city: 'Badulla' },
      { name: 'Haputale', city: 'Badulla' },
      { name: 'Welimada', city: 'Badulla' },
      { name: 'Ella', city: 'Badulla' },
      // Monaragala District
      { name: 'Monaragala', city: 'Monaragala' },
      { name: 'Wellawaya', city: 'Monaragala' },
      // Anuradhapura District
      { name: 'Anuradhapura', city: 'Anuradhapura' },
      { name: 'Kekirawa', city: 'Anuradhapura' },
      { name: 'Medawachchiya', city: 'Anuradhapura' },
      { name: 'Eppawala', city: 'Anuradhapura' },
      { name: 'Tambuttegama', city: 'Anuradhapura' },
      // Polonnaruwa District
      { name: 'Polonnaruwa', city: 'Polonnaruwa' },
      { name: 'Kaduruwela', city: 'Polonnaruwa' },
      { name: 'Hingurakgoda', city: 'Polonnaruwa' },
      // Matale District
      { name: 'Matale', city: 'Matale' },
      { name: 'Dambulla', city: 'Matale' },
      { name: 'Sigiriya', city: 'Matale' },
      { name: 'Galewela', city: 'Matale' },
      // Puttalam District
      { name: 'Puttalam', city: 'Puttalam' },
      { name: 'Chilaw', city: 'Puttalam' },
      { name: 'Wennappuwa', city: 'Puttalam' },
      { name: 'Marawila', city: 'Puttalam' },
      // Hambantota District
      { name: 'Hambantota', city: 'Hambantota' },
      { name: 'Tangalle', city: 'Hambantota' },
      { name: 'Tissamaharama', city: 'Hambantota' },
      { name: 'Ambalantota', city: 'Hambantota' },
      { name: 'Beliatta', city: 'Hambantota' },
      // Jaffna District
      { name: 'Jaffna', city: 'Jaffna' },
      { name: 'Chunnakam', city: 'Jaffna' },
      { name: 'Nallur', city: 'Jaffna' },
      { name: 'Nelliady', city: 'Jaffna' },
      { name: 'Point Pedro', city: 'Jaffna' },
      { name: 'Kopay', city: 'Jaffna' },
      // Vavuniya District
      { name: 'Vavuniya', city: 'Vavuniya' },
      { name: 'Mannar', city: 'Mannar' },
      // Batticaloa District
      { name: 'Batticaloa', city: 'Batticaloa' },
      { name: 'Kalmunai', city: 'Batticaloa' },
      { name: 'Ampara', city: 'Ampara' },
      { name: 'Akkaraipattu', city: 'Ampara' },
      // Trincomalee District
      { name: 'Trincomalee', city: 'Trincomalee' },
      { name: 'Kantalai', city: 'Trincomalee' },
      // Mullaitivu / Kilinochchi
      { name: 'Kilinochchi', city: 'Kilinochchi' },
      { name: 'Mullaitivu', city: 'Mullaitivu' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // PEOPLE'S BANK
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'peoples',
    name: "People's Bank",
    branches: [
      // Colombo District
      { name: 'Colombo Fort', city: 'Colombo' },
      { name: 'Pettah', city: 'Colombo' },
      { name: 'Maradana', city: 'Colombo' },
      { name: 'Borella', city: 'Colombo' },
      { name: 'Narahenpita', city: 'Colombo' },
      { name: 'Bambalapitiya', city: 'Colombo' },
      { name: 'Wellawatte', city: 'Colombo' },
      { name: 'Dehiwala', city: 'Colombo' },
      { name: 'Mount Lavinia', city: 'Colombo' },
      { name: 'Nugegoda', city: 'Colombo' },
      { name: 'Maharagama', city: 'Colombo' },
      { name: 'Kottawa', city: 'Colombo' },
      { name: 'Homagama', city: 'Colombo' },
      { name: 'Piliyandala', city: 'Colombo' },
      { name: 'Moratuwa', city: 'Colombo' },
      { name: 'Ratmalana', city: 'Colombo' },
      { name: 'Malabe', city: 'Colombo' },
      { name: 'Rajagiriya', city: 'Colombo' },
      { name: 'Battaramulla', city: 'Colombo' },
      { name: 'Kotte', city: 'Colombo' },
      { name: 'Nawala', city: 'Colombo' },
      { name: 'Grandpass', city: 'Colombo' },
      { name: 'Kotahena', city: 'Colombo' },
      { name: 'Kelaniya', city: 'Colombo' },
      { name: 'Wattala', city: 'Colombo' },
      { name: 'Ja-Ela', city: 'Colombo' },
      { name: 'Negombo', city: 'Negombo' },
      { name: 'Katunayake', city: 'Colombo' },
      { name: 'Minuwangoda', city: 'Colombo' },
      // Kandy District
      { name: 'Kandy', city: 'Kandy' },
      { name: 'Peradeniya', city: 'Kandy' },
      { name: 'Katugastota', city: 'Kandy' },
      { name: 'Gampola', city: 'Kandy' },
      { name: 'Nawalapitiya', city: 'Kandy' },
      { name: 'Akurana', city: 'Kandy' },
      { name: 'Wattegama', city: 'Kandy' },
      { name: 'Kadugannawa', city: 'Kandy' },
      // Galle District
      { name: 'Galle', city: 'Galle' },
      { name: 'Hikkaduwa', city: 'Galle' },
      { name: 'Ambalangoda', city: 'Galle' },
      { name: 'Karapitiya', city: 'Galle' },
      { name: 'Elpitiya', city: 'Galle' },
      // Matara District
      { name: 'Matara', city: 'Matara' },
      { name: 'Weligama', city: 'Matara' },
      { name: 'Akuressa', city: 'Matara' },
      { name: 'Deniyaya', city: 'Matara' },
      { name: 'Kamburupitiya', city: 'Matara' },
      // Kurunegala District
      { name: 'Kurunegala', city: 'Kurunegala' },
      { name: 'Kuliyapitiya', city: 'Kurunegala' },
      { name: 'Narammala', city: 'Kurunegala' },
      { name: 'Pannala', city: 'Kurunegala' },
      { name: 'Nikaweratiya', city: 'Kurunegala' },
      { name: 'Wariyapola', city: 'Kurunegala' },
      // Gampaha District
      { name: 'Gampaha', city: 'Gampaha' },
      { name: 'Veyangoda', city: 'Gampaha' },
      { name: 'Mirigama', city: 'Gampaha' },
      { name: 'Nittambuwa', city: 'Gampaha' },
      { name: 'Ragama', city: 'Gampaha' },
      // Kalutara District
      { name: 'Kalutara', city: 'Kalutara' },
      { name: 'Panadura', city: 'Kalutara' },
      { name: 'Horana', city: 'Kalutara' },
      { name: 'Aluthgama', city: 'Kalutara' },
      { name: 'Beruwala', city: 'Kalutara' },
      // Ratnapura District
      { name: 'Ratnapura', city: 'Ratnapura' },
      { name: 'Embilipitiya', city: 'Ratnapura' },
      { name: 'Balangoda', city: 'Ratnapura' },
      { name: 'Pelmadulla', city: 'Ratnapura' },
      // Kegalle District
      { name: 'Kegalle', city: 'Kegalle' },
      { name: 'Mawanella', city: 'Kegalle' },
      { name: 'Warakapola', city: 'Kegalle' },
      // Nuwara Eliya District
      { name: 'Nuwara Eliya', city: 'Nuwara Eliya' },
      { name: 'Hatton', city: 'Nuwara Eliya' },
      { name: 'Talawakele', city: 'Nuwara Eliya' },
      // Badulla District
      { name: 'Badulla', city: 'Badulla' },
      { name: 'Bandarawela', city: 'Badulla' },
      { name: 'Haputale', city: 'Badulla' },
      { name: 'Welimada', city: 'Badulla' },
      // Monaragala District
      { name: 'Monaragala', city: 'Monaragala' },
      { name: 'Wellawaya', city: 'Monaragala' },
      // Anuradhapura District
      { name: 'Anuradhapura', city: 'Anuradhapura' },
      { name: 'Kekirawa', city: 'Anuradhapura' },
      { name: 'Medawachchiya', city: 'Anuradhapura' },
      { name: 'Tambuttegama', city: 'Anuradhapura' },
      // Polonnaruwa District
      { name: 'Polonnaruwa', city: 'Polonnaruwa' },
      { name: 'Kaduruwela', city: 'Polonnaruwa' },
      { name: 'Hingurakgoda', city: 'Polonnaruwa' },
      // Matale District
      { name: 'Matale', city: 'Matale' },
      { name: 'Dambulla', city: 'Matale' },
      { name: 'Galewela', city: 'Matale' },
      // Puttalam District
      { name: 'Puttalam', city: 'Puttalam' },
      { name: 'Chilaw', city: 'Puttalam' },
      { name: 'Wennappuwa', city: 'Puttalam' },
      // Hambantota District
      { name: 'Hambantota', city: 'Hambantota' },
      { name: 'Tangalle', city: 'Hambantota' },
      { name: 'Tissamaharama', city: 'Hambantota' },
      { name: 'Ambalantota', city: 'Hambantota' },
      { name: 'Beliatta', city: 'Hambantota' },
      // Jaffna District
      { name: 'Jaffna', city: 'Jaffna' },
      { name: 'Chunnakam', city: 'Jaffna' },
      { name: 'Nallur', city: 'Jaffna' },
      { name: 'Point Pedro', city: 'Jaffna' },
      // Vavuniya / Mannar
      { name: 'Vavuniya', city: 'Vavuniya' },
      { name: 'Mannar', city: 'Mannar' },
      // Batticaloa / Ampara
      { name: 'Batticaloa', city: 'Batticaloa' },
      { name: 'Kalmunai', city: 'Batticaloa' },
      { name: 'Ampara', city: 'Ampara' },
      { name: 'Akkaraipattu', city: 'Ampara' },
      // Trincomalee
      { name: 'Trincomalee', city: 'Trincomalee' },
      { name: 'Kantalai', city: 'Trincomalee' },
      // North
      { name: 'Kilinochchi', city: 'Kilinochchi' },
      { name: 'Mullaitivu', city: 'Mullaitivu' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // COMMERCIAL BANK OF CEYLON
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'com-bank',
    name: 'Commercial Bank of Ceylon',
    branches: [
      // Colombo District
      { name: 'Colombo Fort', city: 'Colombo' },
      { name: 'Pettah', city: 'Colombo' },
      { name: 'Maradana', city: 'Colombo' },
      { name: 'Borella', city: 'Colombo' },
      { name: 'Bambalapitiya', city: 'Colombo' },
      { name: 'Wellawatte', city: 'Colombo' },
      { name: 'Dehiwala', city: 'Colombo' },
      { name: 'Mount Lavinia', city: 'Colombo' },
      { name: 'Nugegoda', city: 'Colombo' },
      { name: 'Maharagama', city: 'Colombo' },
      { name: 'Kottawa', city: 'Colombo' },
      { name: 'Homagama', city: 'Colombo' },
      { name: 'Piliyandala', city: 'Colombo' },
      { name: 'Moratuwa', city: 'Colombo' },
      { name: 'Ratmalana', city: 'Colombo' },
      { name: 'Malabe', city: 'Colombo' },
      { name: 'Rajagiriya', city: 'Colombo' },
      { name: 'Nawala', city: 'Colombo' },
      { name: 'Battaramulla', city: 'Colombo' },
      { name: 'Kotte', city: 'Colombo' },
      { name: 'Kollupitiya', city: 'Colombo' },
      { name: 'Kotahena', city: 'Colombo' },
      { name: 'Kelaniya', city: 'Colombo' },
      { name: 'Wattala', city: 'Colombo' },
      { name: 'Ja-Ela', city: 'Colombo' },
      { name: 'Negombo', city: 'Negombo' },
      { name: 'Katunayake', city: 'Colombo' },
      // Gampaha District
      { name: 'Gampaha', city: 'Gampaha' },
      { name: 'Veyangoda', city: 'Gampaha' },
      { name: 'Mirigama', city: 'Gampaha' },
      { name: 'Nittambuwa', city: 'Gampaha' },
      { name: 'Minuwangoda', city: 'Gampaha' },
      // Kandy District
      { name: 'Kandy City', city: 'Kandy' },
      { name: 'Peradeniya', city: 'Kandy' },
      { name: 'Katugastota', city: 'Kandy' },
      { name: 'Gampola', city: 'Kandy' },
      { name: 'Nawalapitiya', city: 'Kandy' },
      { name: 'Akurana', city: 'Kandy' },
      // Kalutara District
      { name: 'Kalutara', city: 'Kalutara' },
      { name: 'Panadura', city: 'Kalutara' },
      { name: 'Horana', city: 'Kalutara' },
      { name: 'Aluthgama', city: 'Kalutara' },
      { name: 'Beruwala', city: 'Kalutara' },
      // Galle District
      { name: 'Galle', city: 'Galle' },
      { name: 'Hikkaduwa', city: 'Galle' },
      { name: 'Ambalangoda', city: 'Galle' },
      { name: 'Elpitiya', city: 'Galle' },
      // Matara District
      { name: 'Matara', city: 'Matara' },
      { name: 'Weligama', city: 'Matara' },
      { name: 'Akuressa', city: 'Matara' },
      { name: 'Kamburupitiya', city: 'Matara' },
      // Kurunegala District
      { name: 'Kurunegala', city: 'Kurunegala' },
      { name: 'Kuliyapitiya', city: 'Kurunegala' },
      { name: 'Narammala', city: 'Kurunegala' },
      { name: 'Nikaweratiya', city: 'Kurunegala' },
      { name: 'Wariyapola', city: 'Kurunegala' },
      // Ratnapura District
      { name: 'Ratnapura', city: 'Ratnapura' },
      { name: 'Embilipitiya', city: 'Ratnapura' },
      { name: 'Balangoda', city: 'Ratnapura' },
      // Kegalle District
      { name: 'Kegalle', city: 'Kegalle' },
      { name: 'Mawanella', city: 'Kegalle' },
      // Nuwara Eliya District
      { name: 'Nuwara Eliya', city: 'Nuwara Eliya' },
      { name: 'Hatton', city: 'Nuwara Eliya' },
      // Badulla District
      { name: 'Badulla', city: 'Badulla' },
      { name: 'Bandarawela', city: 'Badulla' },
      { name: 'Haputale', city: 'Badulla' },
      // Anuradhapura District
      { name: 'Anuradhapura', city: 'Anuradhapura' },
      { name: 'Kekirawa', city: 'Anuradhapura' },
      { name: 'Tambuttegama', city: 'Anuradhapura' },
      // Polonnaruwa District
      { name: 'Polonnaruwa', city: 'Polonnaruwa' },
      { name: 'Kaduruwela', city: 'Polonnaruwa' },
      // Matale District
      { name: 'Matale', city: 'Matale' },
      { name: 'Dambulla', city: 'Matale' },
      // Puttalam District
      { name: 'Puttalam', city: 'Puttalam' },
      { name: 'Chilaw', city: 'Puttalam' },
      { name: 'Wennappuwa', city: 'Puttalam' },
      // Hambantota District
      { name: 'Hambantota', city: 'Hambantota' },
      { name: 'Tangalle', city: 'Hambantota' },
      { name: 'Tissamaharama', city: 'Hambantota' },
      // Jaffna District
      { name: 'Jaffna', city: 'Jaffna' },
      { name: 'Chunnakam', city: 'Jaffna' },
      { name: 'Point Pedro', city: 'Jaffna' },
      // Vavuniya / Batticaloa / Trincomalee
      { name: 'Vavuniya', city: 'Vavuniya' },
      { name: 'Batticaloa', city: 'Batticaloa' },
      { name: 'Kalmunai', city: 'Batticaloa' },
      { name: 'Ampara', city: 'Ampara' },
      { name: 'Trincomalee', city: 'Trincomalee' },
      { name: 'Monaragala', city: 'Monaragala' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // HATTON NATIONAL BANK
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'hnb',
    name: 'Hatton National Bank',
    branches: [
      // Colombo District
      { name: 'Colombo Fort', city: 'Colombo' },
      { name: 'Pettah', city: 'Colombo' },
      { name: 'Maradana', city: 'Colombo' },
      { name: 'Borella', city: 'Colombo' },
      { name: 'Bambalapitiya', city: 'Colombo' },
      { name: 'Wellawatte', city: 'Colombo' },
      { name: 'Dehiwala', city: 'Colombo' },
      { name: 'Mount Lavinia', city: 'Colombo' },
      { name: 'Nugegoda', city: 'Colombo' },
      { name: 'Maharagama', city: 'Colombo' },
      { name: 'Kottawa', city: 'Colombo' },
      { name: 'Piliyandala', city: 'Colombo' },
      { name: 'Moratuwa', city: 'Colombo' },
      { name: 'Malabe', city: 'Colombo' },
      { name: 'Rajagiriya', city: 'Colombo' },
      { name: 'Battaramulla', city: 'Colombo' },
      { name: 'Kotahena', city: 'Colombo' },
      { name: 'Kelaniya', city: 'Colombo' },
      { name: 'Wattala', city: 'Colombo' },
      { name: 'Ja-Ela', city: 'Colombo' },
      { name: 'Negombo', city: 'Negombo' },
      // Gampaha District
      { name: 'Gampaha', city: 'Gampaha' },
      { name: 'Nittambuwa', city: 'Gampaha' },
      { name: 'Veyangoda', city: 'Gampaha' },
      // Kandy District
      { name: 'Kandy', city: 'Kandy' },
      { name: 'Peradeniya', city: 'Kandy' },
      { name: 'Katugastota', city: 'Kandy' },
      { name: 'Gampola', city: 'Kandy' },
      { name: 'Nawalapitiya', city: 'Kandy' },
      { name: 'Akurana', city: 'Kandy' },
      // Nuwara Eliya District
      { name: 'Nuwara Eliya', city: 'Nuwara Eliya' },
      { name: 'Hatton', city: 'Nuwara Eliya' },
      { name: 'Talawakele', city: 'Nuwara Eliya' },
      { name: 'Kotagala', city: 'Nuwara Eliya' },
      { name: 'Dickoya', city: 'Nuwara Eliya' },
      { name: 'Lindula', city: 'Nuwara Eliya' },
      // Galle District
      { name: 'Galle', city: 'Galle' },
      { name: 'Hikkaduwa', city: 'Galle' },
      { name: 'Ambalangoda', city: 'Galle' },
      { name: 'Elpitiya', city: 'Galle' },
      // Matara District
      { name: 'Matara', city: 'Matara' },
      { name: 'Weligama', city: 'Matara' },
      { name: 'Akuressa', city: 'Matara' },
      // Kurunegala District
      { name: 'Kurunegala', city: 'Kurunegala' },
      { name: 'Kuliyapitiya', city: 'Kurunegala' },
      { name: 'Narammala', city: 'Kurunegala' },
      { name: 'Nikaweratiya', city: 'Kurunegala' },
      // Kalutara District
      { name: 'Kalutara', city: 'Kalutara' },
      { name: 'Panadura', city: 'Kalutara' },
      { name: 'Horana', city: 'Kalutara' },
      { name: 'Aluthgama', city: 'Kalutara' },
      // Ratnapura District
      { name: 'Ratnapura', city: 'Ratnapura' },
      { name: 'Embilipitiya', city: 'Ratnapura' },
      { name: 'Balangoda', city: 'Ratnapura' },
      // Kegalle District
      { name: 'Kegalle', city: 'Kegalle' },
      { name: 'Mawanella', city: 'Kegalle' },
      // Badulla District
      { name: 'Badulla', city: 'Badulla' },
      { name: 'Bandarawela', city: 'Badulla' },
      { name: 'Haputale', city: 'Badulla' },
      { name: 'Welimada', city: 'Badulla' },
      // Anuradhapura District
      { name: 'Anuradhapura', city: 'Anuradhapura' },
      { name: 'Kekirawa', city: 'Anuradhapura' },
      // Polonnaruwa District
      { name: 'Polonnaruwa', city: 'Polonnaruwa' },
      // Matale District
      { name: 'Matale', city: 'Matale' },
      { name: 'Dambulla', city: 'Matale' },
      // Puttalam District
      { name: 'Puttalam', city: 'Puttalam' },
      { name: 'Chilaw', city: 'Puttalam' },
      // Hambantota District
      { name: 'Hambantota', city: 'Hambantota' },
      { name: 'Tangalle', city: 'Hambantota' },
      { name: 'Tissamaharama', city: 'Hambantota' },
      // Jaffna District
      { name: 'Jaffna', city: 'Jaffna' },
      // Vavuniya / Batticaloa / Trincomalee
      { name: 'Vavuniya', city: 'Vavuniya' },
      { name: 'Batticaloa', city: 'Batticaloa' },
      { name: 'Ampara', city: 'Ampara' },
      { name: 'Trincomalee', city: 'Trincomalee' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // SAMPATH BANK
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'sampath',
    name: 'Sampath Bank',
    branches: [
      // Colombo District
      { name: 'Colombo Fort', city: 'Colombo' },
      { name: 'Pettah', city: 'Colombo' },
      { name: 'Maradana', city: 'Colombo' },
      { name: 'Borella', city: 'Colombo' },
      { name: 'Bambalapitiya', city: 'Colombo' },
      { name: 'Wellawatte', city: 'Colombo' },
      { name: 'Dehiwala', city: 'Colombo' },
      { name: 'Mount Lavinia', city: 'Colombo' },
      { name: 'Nugegoda', city: 'Colombo' },
      { name: 'Maharagama', city: 'Colombo' },
      { name: 'Kottawa', city: 'Colombo' },
      { name: 'Piliyandala', city: 'Colombo' },
      { name: 'Moratuwa', city: 'Colombo' },
      { name: 'Ratmalana', city: 'Colombo' },
      { name: 'Malabe', city: 'Colombo' },
      { name: 'Rajagiriya', city: 'Colombo' },
      { name: 'Battaramulla', city: 'Colombo' },
      { name: 'Nawala', city: 'Colombo' },
      { name: 'Kotahena', city: 'Colombo' },
      { name: 'Kelaniya', city: 'Colombo' },
      { name: 'Wattala', city: 'Colombo' },
      { name: 'Ja-Ela', city: 'Colombo' },
      { name: 'Negombo', city: 'Negombo' },
      { name: 'Katunayake', city: 'Colombo' },
      // Gampaha District
      { name: 'Gampaha', city: 'Gampaha' },
      { name: 'Nittambuwa', city: 'Gampaha' },
      { name: 'Veyangoda', city: 'Gampaha' },
      { name: 'Minuwangoda', city: 'Gampaha' },
      // Kandy District
      { name: 'Kandy', city: 'Kandy' },
      { name: 'Peradeniya', city: 'Kandy' },
      { name: 'Katugastota', city: 'Kandy' },
      { name: 'Gampola', city: 'Kandy' },
      { name: 'Nawalapitiya', city: 'Kandy' },
      // Kalutara District
      { name: 'Kalutara', city: 'Kalutara' },
      { name: 'Panadura', city: 'Kalutara' },
      { name: 'Horana', city: 'Kalutara' },
      { name: 'Aluthgama', city: 'Kalutara' },
      { name: 'Beruwala', city: 'Kalutara' },
      // Galle District
      { name: 'Galle', city: 'Galle' },
      { name: 'Hikkaduwa', city: 'Galle' },
      { name: 'Ambalangoda', city: 'Galle' },
      { name: 'Elpitiya', city: 'Galle' },
      // Matara District
      { name: 'Matara', city: 'Matara' },
      { name: 'Weligama', city: 'Matara' },
      { name: 'Akuressa', city: 'Matara' },
      // Kurunegala District
      { name: 'Kurunegala', city: 'Kurunegala' },
      { name: 'Kuliyapitiya', city: 'Kurunegala' },
      { name: 'Narammala', city: 'Kurunegala' },
      { name: 'Nikaweratiya', city: 'Kurunegala' },
      { name: 'Wariyapola', city: 'Kurunegala' },
      // Ratnapura District
      { name: 'Ratnapura', city: 'Ratnapura' },
      { name: 'Embilipitiya', city: 'Ratnapura' },
      { name: 'Balangoda', city: 'Ratnapura' },
      // Kegalle District
      { name: 'Kegalle', city: 'Kegalle' },
      { name: 'Mawanella', city: 'Kegalle' },
      // Nuwara Eliya District
      { name: 'Nuwara Eliya', city: 'Nuwara Eliya' },
      { name: 'Hatton', city: 'Nuwara Eliya' },
      // Badulla District
      { name: 'Badulla', city: 'Badulla' },
      { name: 'Bandarawela', city: 'Badulla' },
      // Anuradhapura District
      { name: 'Anuradhapura', city: 'Anuradhapura' },
      { name: 'Kekirawa', city: 'Anuradhapura' },
      // Polonnaruwa District
      { name: 'Polonnaruwa', city: 'Polonnaruwa' },
      // Matale District
      { name: 'Matale', city: 'Matale' },
      { name: 'Dambulla', city: 'Matale' },
      // Puttalam District
      { name: 'Puttalam', city: 'Puttalam' },
      { name: 'Chilaw', city: 'Puttalam' },
      // Hambantota District
      { name: 'Hambantota', city: 'Hambantota' },
      { name: 'Tangalle', city: 'Hambantota' },
      { name: 'Tissamaharama', city: 'Hambantota' },
      // Jaffna / Vavuniya
      { name: 'Jaffna', city: 'Jaffna' },
      { name: 'Vavuniya', city: 'Vavuniya' },
      // Batticaloa / Trincomalee
      { name: 'Batticaloa', city: 'Batticaloa' },
      { name: 'Kalmunai', city: 'Batticaloa' },
      { name: 'Ampara', city: 'Ampara' },
      { name: 'Trincomalee', city: 'Trincomalee' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // SEYLAN BANK
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'seylan',
    name: 'Seylan Bank',
    branches: [
      // Colombo District
      { name: 'Colombo Fort', city: 'Colombo' },
      { name: 'Pettah', city: 'Colombo' },
      { name: 'Maradana', city: 'Colombo' },
      { name: 'Borella', city: 'Colombo' },
      { name: 'Bambalapitiya', city: 'Colombo' },
      { name: 'Wellawatte', city: 'Colombo' },
      { name: 'Dehiwala', city: 'Colombo' },
      { name: 'Mount Lavinia', city: 'Colombo' },
      { name: 'Nugegoda', city: 'Colombo' },
      { name: 'Maharagama', city: 'Colombo' },
      { name: 'Kottawa', city: 'Colombo' },
      { name: 'Piliyandala', city: 'Colombo' },
      { name: 'Moratuwa', city: 'Colombo' },
      { name: 'Rajagiriya', city: 'Colombo' },
      { name: 'Battaramulla', city: 'Colombo' },
      { name: 'Kelaniya', city: 'Colombo' },
      { name: 'Wattala', city: 'Colombo' },
      { name: 'Negombo', city: 'Negombo' },
      // Gampaha District
      { name: 'Gampaha', city: 'Gampaha' },
      { name: 'Nittambuwa', city: 'Gampaha' },
      // Kandy District
      { name: 'Kandy', city: 'Kandy' },
      { name: 'Katugastota', city: 'Kandy' },
      { name: 'Gampola', city: 'Kandy' },
      { name: 'Nawalapitiya', city: 'Kandy' },
      // Kalutara District
      { name: 'Kalutara', city: 'Kalutara' },
      { name: 'Panadura', city: 'Kalutara' },
      { name: 'Horana', city: 'Kalutara' },
      { name: 'Aluthgama', city: 'Kalutara' },
      // Galle District
      { name: 'Galle', city: 'Galle' },
      { name: 'Hikkaduwa', city: 'Galle' },
      { name: 'Ambalangoda', city: 'Galle' },
      // Matara District
      { name: 'Matara', city: 'Matara' },
      { name: 'Weligama', city: 'Matara' },
      // Kurunegala District
      { name: 'Kurunegala', city: 'Kurunegala' },
      { name: 'Kuliyapitiya', city: 'Kurunegala' },
      // Ratnapura District
      { name: 'Ratnapura', city: 'Ratnapura' },
      { name: 'Embilipitiya', city: 'Ratnapura' },
      // Kegalle District
      { name: 'Kegalle', city: 'Kegalle' },
      // Nuwara Eliya District
      { name: 'Nuwara Eliya', city: 'Nuwara Eliya' },
      // Badulla District
      { name: 'Badulla', city: 'Badulla' },
      { name: 'Bandarawela', city: 'Badulla' },
      // Anuradhapura District
      { name: 'Anuradhapura', city: 'Anuradhapura' },
      // Polonnaruwa District
      { name: 'Polonnaruwa', city: 'Polonnaruwa' },
      // Matale District
      { name: 'Matale', city: 'Matale' },
      { name: 'Dambulla', city: 'Matale' },
      // Puttalam District
      { name: 'Chilaw', city: 'Puttalam' },
      // Hambantota District
      { name: 'Hambantota', city: 'Hambantota' },
      { name: 'Tangalle', city: 'Hambantota' },
      { name: 'Tissamaharama', city: 'Hambantota' },
      // Jaffna / Vavuniya
      { name: 'Jaffna', city: 'Jaffna' },
      { name: 'Vavuniya', city: 'Vavuniya' },
      // Batticaloa / Trincomalee
      { name: 'Batticaloa', city: 'Batticaloa' },
      { name: 'Kalmunai', city: 'Batticaloa' },
      { name: 'Trincomalee', city: 'Trincomalee' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // NATIONAL SAVINGS BANK
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'nsb',
    name: 'National Savings Bank',
    branches: [
      // Colombo District
      { name: 'Colombo Fort', city: 'Colombo' },
      { name: 'Pettah', city: 'Colombo' },
      { name: 'Maradana', city: 'Colombo' },
      { name: 'Borella', city: 'Colombo' },
      { name: 'Bambalapitiya', city: 'Colombo' },
      { name: 'Wellawatte', city: 'Colombo' },
      { name: 'Dehiwala', city: 'Colombo' },
      { name: 'Mount Lavinia', city: 'Colombo' },
      { name: 'Nugegoda', city: 'Colombo' },
      { name: 'Maharagama', city: 'Colombo' },
      { name: 'Piliyandala', city: 'Colombo' },
      { name: 'Moratuwa', city: 'Colombo' },
      { name: 'Malabe', city: 'Colombo' },
      { name: 'Rajagiriya', city: 'Colombo' },
      { name: 'Battaramulla', city: 'Colombo' },
      { name: 'Kotahena', city: 'Colombo' },
      { name: 'Kelaniya', city: 'Colombo' },
      { name: 'Wattala', city: 'Colombo' },
      { name: 'Ja-Ela', city: 'Colombo' },
      { name: 'Negombo', city: 'Negombo' },
      { name: 'Katunayake', city: 'Colombo' },
      // Gampaha District
      { name: 'Gampaha', city: 'Gampaha' },
      { name: 'Veyangoda', city: 'Gampaha' },
      { name: 'Mirigama', city: 'Gampaha' },
      { name: 'Nittambuwa', city: 'Gampaha' },
      // Kandy District
      { name: 'Kandy', city: 'Kandy' },
      { name: 'Peradeniya', city: 'Kandy' },
      { name: 'Katugastota', city: 'Kandy' },
      { name: 'Gampola', city: 'Kandy' },
      { name: 'Nawalapitiya', city: 'Kandy' },
      { name: 'Wattegama', city: 'Kandy' },
      // Kalutara District
      { name: 'Kalutara', city: 'Kalutara' },
      { name: 'Panadura', city: 'Kalutara' },
      { name: 'Horana', city: 'Kalutara' },
      { name: 'Aluthgama', city: 'Kalutara' },
      { name: 'Beruwala', city: 'Kalutara' },
      // Galle District
      { name: 'Galle', city: 'Galle' },
      { name: 'Hikkaduwa', city: 'Galle' },
      { name: 'Ambalangoda', city: 'Galle' },
      { name: 'Elpitiya', city: 'Galle' },
      { name: 'Baddegama', city: 'Galle' },
      // Matara District
      { name: 'Matara', city: 'Matara' },
      { name: 'Weligama', city: 'Matara' },
      { name: 'Akuressa', city: 'Matara' },
      { name: 'Deniyaya', city: 'Matara' },
      { name: 'Kamburupitiya', city: 'Matara' },
      // Kurunegala District
      { name: 'Kurunegala', city: 'Kurunegala' },
      { name: 'Kuliyapitiya', city: 'Kurunegala' },
      { name: 'Narammala', city: 'Kurunegala' },
      { name: 'Nikaweratiya', city: 'Kurunegala' },
      { name: 'Wariyapola', city: 'Kurunegala' },
      // Ratnapura District
      { name: 'Ratnapura', city: 'Ratnapura' },
      { name: 'Embilipitiya', city: 'Ratnapura' },
      { name: 'Balangoda', city: 'Ratnapura' },
      { name: 'Pelmadulla', city: 'Ratnapura' },
      // Kegalle District
      { name: 'Kegalle', city: 'Kegalle' },
      { name: 'Mawanella', city: 'Kegalle' },
      { name: 'Warakapola', city: 'Kegalle' },
      // Nuwara Eliya District
      { name: 'Nuwara Eliya', city: 'Nuwara Eliya' },
      { name: 'Hatton', city: 'Nuwara Eliya' },
      { name: 'Talawakele', city: 'Nuwara Eliya' },
      // Badulla District
      { name: 'Badulla', city: 'Badulla' },
      { name: 'Bandarawela', city: 'Badulla' },
      { name: 'Haputale', city: 'Badulla' },
      { name: 'Welimada', city: 'Badulla' },
      { name: 'Ella', city: 'Badulla' },
      // Monaragala District
      { name: 'Monaragala', city: 'Monaragala' },
      { name: 'Wellawaya', city: 'Monaragala' },
      // Anuradhapura District
      { name: 'Anuradhapura', city: 'Anuradhapura' },
      { name: 'Kekirawa', city: 'Anuradhapura' },
      { name: 'Medawachchiya', city: 'Anuradhapura' },
      { name: 'Tambuttegama', city: 'Anuradhapura' },
      // Polonnaruwa District
      { name: 'Polonnaruwa', city: 'Polonnaruwa' },
      { name: 'Kaduruwela', city: 'Polonnaruwa' },
      // Matale District
      { name: 'Matale', city: 'Matale' },
      { name: 'Dambulla', city: 'Matale' },
      { name: 'Galewela', city: 'Matale' },
      // Puttalam District
      { name: 'Puttalam', city: 'Puttalam' },
      { name: 'Chilaw', city: 'Puttalam' },
      { name: 'Wennappuwa', city: 'Puttalam' },
      // Hambantota District
      { name: 'Hambantota', city: 'Hambantota' },
      { name: 'Tangalle', city: 'Hambantota' },
      { name: 'Tissamaharama', city: 'Hambantota' },
      { name: 'Ambalantota', city: 'Hambantota' },
      // Jaffna District
      { name: 'Jaffna', city: 'Jaffna' },
      { name: 'Chunnakam', city: 'Jaffna' },
      { name: 'Nallur', city: 'Jaffna' },
      { name: 'Point Pedro', city: 'Jaffna' },
      // Vavuniya / Mannar
      { name: 'Vavuniya', city: 'Vavuniya' },
      { name: 'Mannar', city: 'Mannar' },
      // Batticaloa / Ampara
      { name: 'Batticaloa', city: 'Batticaloa' },
      { name: 'Kalmunai', city: 'Batticaloa' },
      { name: 'Ampara', city: 'Ampara' },
      // Trincomalee
      { name: 'Trincomalee', city: 'Trincomalee' },
      // North
      { name: 'Kilinochchi', city: 'Kilinochchi' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // DFCC BANK
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'dfcc',
    name: 'DFCC Bank',
    branches: [
      // Colombo District
      { name: 'Colombo Fort', city: 'Colombo' },
      { name: 'Pettah', city: 'Colombo' },
      { name: 'Borella', city: 'Colombo' },
      { name: 'Bambalapitiya', city: 'Colombo' },
      { name: 'Wellawatte', city: 'Colombo' },
      { name: 'Dehiwala', city: 'Colombo' },
      { name: 'Mount Lavinia', city: 'Colombo' },
      { name: 'Nugegoda', city: 'Colombo' },
      { name: 'Maharagama', city: 'Colombo' },
      { name: 'Moratuwa', city: 'Colombo' },
      { name: 'Rajagiriya', city: 'Colombo' },
      { name: 'Battaramulla', city: 'Colombo' },
      { name: 'Kelaniya', city: 'Colombo' },
      { name: 'Wattala', city: 'Colombo' },
      { name: 'Negombo', city: 'Negombo' },
      // Gampaha District
      { name: 'Gampaha', city: 'Gampaha' },
      { name: 'Nittambuwa', city: 'Gampaha' },
      // Kandy District
      { name: 'Kandy', city: 'Kandy' },
      { name: 'Katugastota', city: 'Kandy' },
      { name: 'Gampola', city: 'Kandy' },
      { name: 'Nawalapitiya', city: 'Kandy' },
      // Kalutara District
      { name: 'Kalutara', city: 'Kalutara' },
      { name: 'Panadura', city: 'Kalutara' },
      { name: 'Horana', city: 'Kalutara' },
      // Galle District
      { name: 'Galle', city: 'Galle' },
      { name: 'Hikkaduwa', city: 'Galle' },
      { name: 'Ambalangoda', city: 'Galle' },
      // Matara District
      { name: 'Matara', city: 'Matara' },
      { name: 'Weligama', city: 'Matara' },
      // Kurunegala District
      { name: 'Kurunegala', city: 'Kurunegala' },
      { name: 'Kuliyapitiya', city: 'Kurunegala' },
      { name: 'Narammala', city: 'Kurunegala' },
      // Ratnapura District
      { name: 'Ratnapura', city: 'Ratnapura' },
      { name: 'Embilipitiya', city: 'Ratnapura' },
      { name: 'Balangoda', city: 'Ratnapura' },
      // Kegalle District
      { name: 'Kegalle', city: 'Kegalle' },
      // Nuwara Eliya District
      { name: 'Nuwara Eliya', city: 'Nuwara Eliya' },
      { name: 'Hatton', city: 'Nuwara Eliya' },
      // Badulla District
      { name: 'Badulla', city: 'Badulla' },
      { name: 'Bandarawela', city: 'Badulla' },
      // Anuradhapura District
      { name: 'Anuradhapura', city: 'Anuradhapura' },
      // Polonnaruwa District
      { name: 'Polonnaruwa', city: 'Polonnaruwa' },
      // Matale District
      { name: 'Matale', city: 'Matale' },
      { name: 'Dambulla', city: 'Matale' },
      // Puttalam District
      { name: 'Chilaw', city: 'Puttalam' },
      { name: 'Puttalam', city: 'Puttalam' },
      // Hambantota District
      { name: 'Hambantota', city: 'Hambantota' },
      { name: 'Tangalle', city: 'Hambantota' },
      // Jaffna / Vavuniya
      { name: 'Jaffna', city: 'Jaffna' },
      { name: 'Vavuniya', city: 'Vavuniya' },
      // Batticaloa / Trincomalee
      { name: 'Batticaloa', city: 'Batticaloa' },
      { name: 'Trincomalee', city: 'Trincomalee' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // NATIONS TRUST BANK
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'ntb',
    name: 'Nations Trust Bank',
    branches: [
      // Colombo District
      { name: 'Colombo Fort', city: 'Colombo' },
      { name: 'Pettah', city: 'Colombo' },
      { name: 'Maradana', city: 'Colombo' },
      { name: 'Borella', city: 'Colombo' },
      { name: 'Bambalapitiya', city: 'Colombo' },
      { name: 'Wellawatte', city: 'Colombo' },
      { name: 'Dehiwala', city: 'Colombo' },
      { name: 'Mount Lavinia', city: 'Colombo' },
      { name: 'Nugegoda', city: 'Colombo' },
      { name: 'Maharagama', city: 'Colombo' },
      { name: 'Kottawa', city: 'Colombo' },
      { name: 'Piliyandala', city: 'Colombo' },
      { name: 'Moratuwa', city: 'Colombo' },
      { name: 'Rajagiriya', city: 'Colombo' },
      { name: 'Battaramulla', city: 'Colombo' },
      { name: 'Nawala', city: 'Colombo' },
      { name: 'Kelaniya', city: 'Colombo' },
      { name: 'Wattala', city: 'Colombo' },
      { name: 'Ja-Ela', city: 'Colombo' },
      { name: 'Negombo', city: 'Negombo' },
      // Gampaha District
      { name: 'Gampaha', city: 'Gampaha' },
      { name: 'Nittambuwa', city: 'Gampaha' },
      // Kandy District
      { name: 'Kandy', city: 'Kandy' },
      { name: 'Katugastota', city: 'Kandy' },
      { name: 'Gampola', city: 'Kandy' },
      // Kalutara District
      { name: 'Kalutara', city: 'Kalutara' },
      { name: 'Panadura', city: 'Kalutara' },
      { name: 'Horana', city: 'Kalutara' },
      { name: 'Aluthgama', city: 'Kalutara' },
      // Galle District
      { name: 'Galle', city: 'Galle' },
      { name: 'Hikkaduwa', city: 'Galle' },
      // Matara District
      { name: 'Matara', city: 'Matara' },
      // Kurunegala District
      { name: 'Kurunegala', city: 'Kurunegala' },
      { name: 'Kuliyapitiya', city: 'Kurunegala' },
      // Ratnapura District
      { name: 'Ratnapura', city: 'Ratnapura' },
      // Kegalle District
      { name: 'Kegalle', city: 'Kegalle' },
      // Nuwara Eliya District
      { name: 'Nuwara Eliya', city: 'Nuwara Eliya' },
      // Badulla District
      { name: 'Badulla', city: 'Badulla' },
      // Anuradhapura District
      { name: 'Anuradhapura', city: 'Anuradhapura' },
      // Matale District
      { name: 'Dambulla', city: 'Matale' },
      // Hambantota District
      { name: 'Hambantota', city: 'Hambantota' },
      // Jaffna
      { name: 'Jaffna', city: 'Jaffna' },
      // Batticaloa / Trincomalee
      { name: 'Batticaloa', city: 'Batticaloa' },
      { name: 'Trincomalee', city: 'Trincomalee' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // NATIONAL DEVELOPMENT BANK
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'ndb',
    name: 'National Development Bank',
    branches: [
      // Colombo District
      { name: 'Colombo Fort', city: 'Colombo' },
      { name: 'Pettah', city: 'Colombo' },
      { name: 'Maradana', city: 'Colombo' },
      { name: 'Borella', city: 'Colombo' },
      { name: 'Bambalapitiya', city: 'Colombo' },
      { name: 'Wellawatte', city: 'Colombo' },
      { name: 'Dehiwala', city: 'Colombo' },
      { name: 'Mount Lavinia', city: 'Colombo' },
      { name: 'Nugegoda', city: 'Colombo' },
      { name: 'Maharagama', city: 'Colombo' },
      { name: 'Moratuwa', city: 'Colombo' },
      { name: 'Rajagiriya', city: 'Colombo' },
      { name: 'Battaramulla', city: 'Colombo' },
      { name: 'Kelaniya', city: 'Colombo' },
      { name: 'Wattala', city: 'Colombo' },
      { name: 'Negombo', city: 'Negombo' },
      // Gampaha District
      { name: 'Gampaha', city: 'Gampaha' },
      { name: 'Nittambuwa', city: 'Gampaha' },
      // Kandy District
      { name: 'Kandy', city: 'Kandy' },
      { name: 'Katugastota', city: 'Kandy' },
      { name: 'Gampola', city: 'Kandy' },
      { name: 'Nawalapitiya', city: 'Kandy' },
      // Kalutara District
      { name: 'Kalutara', city: 'Kalutara' },
      { name: 'Panadura', city: 'Kalutara' },
      { name: 'Horana', city: 'Kalutara' },
      // Galle District
      { name: 'Galle', city: 'Galle' },
      { name: 'Hikkaduwa', city: 'Galle' },
      { name: 'Ambalangoda', city: 'Galle' },
      // Matara District
      { name: 'Matara', city: 'Matara' },
      { name: 'Weligama', city: 'Matara' },
      // Kurunegala District
      { name: 'Kurunegala', city: 'Kurunegala' },
      { name: 'Kuliyapitiya', city: 'Kurunegala' },
      // Ratnapura District
      { name: 'Ratnapura', city: 'Ratnapura' },
      { name: 'Embilipitiya', city: 'Ratnapura' },
      // Kegalle District
      { name: 'Kegalle', city: 'Kegalle' },
      // Nuwara Eliya District
      { name: 'Nuwara Eliya', city: 'Nuwara Eliya' },
      { name: 'Hatton', city: 'Nuwara Eliya' },
      // Badulla District
      { name: 'Badulla', city: 'Badulla' },
      { name: 'Bandarawela', city: 'Badulla' },
      // Anuradhapura District
      { name: 'Anuradhapura', city: 'Anuradhapura' },
      // Polonnaruwa District
      { name: 'Polonnaruwa', city: 'Polonnaruwa' },
      // Matale District
      { name: 'Matale', city: 'Matale' },
      { name: 'Dambulla', city: 'Matale' },
      // Puttalam District
      { name: 'Chilaw', city: 'Puttalam' },
      // Hambantota District
      { name: 'Hambantota', city: 'Hambantota' },
      { name: 'Tangalle', city: 'Hambantota' },
      // Jaffna / Vavuniya
      { name: 'Jaffna', city: 'Jaffna' },
      { name: 'Vavuniya', city: 'Vavuniya' },
      // Batticaloa / Trincomalee
      { name: 'Batticaloa', city: 'Batticaloa' },
      { name: 'Trincomalee', city: 'Trincomalee' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // PAN ASIA BANK
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'pan-asia',
    name: 'Pan Asia Bank',
    branches: [
      { name: 'Colombo Fort', city: 'Colombo' },
      { name: 'Pettah', city: 'Colombo' },
      { name: 'Borella', city: 'Colombo' },
      { name: 'Bambalapitiya', city: 'Colombo' },
      { name: 'Wellawatte', city: 'Colombo' },
      { name: 'Dehiwala', city: 'Colombo' },
      { name: 'Nugegoda', city: 'Colombo' },
      { name: 'Maharagama', city: 'Colombo' },
      { name: 'Moratuwa', city: 'Colombo' },
      { name: 'Rajagiriya', city: 'Colombo' },
      { name: 'Kelaniya', city: 'Colombo' },
      { name: 'Wattala', city: 'Colombo' },
      { name: 'Negombo', city: 'Negombo' },
      { name: 'Gampaha', city: 'Gampaha' },
      { name: 'Kandy', city: 'Kandy' },
      { name: 'Katugastota', city: 'Kandy' },
      { name: 'Gampola', city: 'Kandy' },
      { name: 'Kalutara', city: 'Kalutara' },
      { name: 'Panadura', city: 'Kalutara' },
      { name: 'Galle', city: 'Galle' },
      { name: 'Hikkaduwa', city: 'Galle' },
      { name: 'Matara', city: 'Matara' },
      { name: 'Kurunegala', city: 'Kurunegala' },
      { name: 'Kuliyapitiya', city: 'Kurunegala' },
      { name: 'Ratnapura', city: 'Ratnapura' },
      { name: 'Kegalle', city: 'Kegalle' },
      { name: 'Nuwara Eliya', city: 'Nuwara Eliya' },
      { name: 'Badulla', city: 'Badulla' },
      { name: 'Anuradhapura', city: 'Anuradhapura' },
      { name: 'Dambulla', city: 'Matale' },
      { name: 'Matale', city: 'Matale' },
      { name: 'Chilaw', city: 'Puttalam' },
      { name: 'Hambantota', city: 'Hambantota' },
      { name: 'Jaffna', city: 'Jaffna' },
      { name: 'Vavuniya', city: 'Vavuniya' },
      { name: 'Batticaloa', city: 'Batticaloa' },
      { name: 'Trincomalee', city: 'Trincomalee' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // UNION BANK OF COLOMBO
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'union',
    name: 'Union Bank of Colombo',
    branches: [
      { name: 'Colombo Fort', city: 'Colombo' },
      { name: 'Pettah', city: 'Colombo' },
      { name: 'Borella', city: 'Colombo' },
      { name: 'Bambalapitiya', city: 'Colombo' },
      { name: 'Wellawatte', city: 'Colombo' },
      { name: 'Nugegoda', city: 'Colombo' },
      { name: 'Maharagama', city: 'Colombo' },
      { name: 'Moratuwa', city: 'Colombo' },
      { name: 'Rajagiriya', city: 'Colombo' },
      { name: 'Battaramulla', city: 'Colombo' },
      { name: 'Kelaniya', city: 'Colombo' },
      { name: 'Wattala', city: 'Colombo' },
      { name: 'Negombo', city: 'Negombo' },
      { name: 'Gampaha', city: 'Gampaha' },
      { name: 'Kandy', city: 'Kandy' },
      { name: 'Gampola', city: 'Kandy' },
      { name: 'Kalutara', city: 'Kalutara' },
      { name: 'Panadura', city: 'Kalutara' },
      { name: 'Galle', city: 'Galle' },
      { name: 'Matara', city: 'Matara' },
      { name: 'Kurunegala', city: 'Kurunegala' },
      { name: 'Kuliyapitiya', city: 'Kurunegala' },
      { name: 'Ratnapura', city: 'Ratnapura' },
      { name: 'Kegalle', city: 'Kegalle' },
      { name: 'Badulla', city: 'Badulla' },
      { name: 'Anuradhapura', city: 'Anuradhapura' },
      { name: 'Dambulla', city: 'Matale' },
      { name: 'Hambantota', city: 'Hambantota' },
      { name: 'Jaffna', city: 'Jaffna' },
      { name: 'Batticaloa', city: 'Batticaloa' },
      { name: 'Trincomalee', city: 'Trincomalee' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // AMANA BANK
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'amana',
    name: 'Amana Bank',
    branches: [
      { name: 'Colombo Fort', city: 'Colombo' },
      { name: 'Pettah', city: 'Colombo' },
      { name: 'Borella', city: 'Colombo' },
      { name: 'Wellawatte', city: 'Colombo' },
      { name: 'Nugegoda', city: 'Colombo' },
      { name: 'Moratuwa', city: 'Colombo' },
      { name: 'Negombo', city: 'Negombo' },
      { name: 'Kandy', city: 'Kandy' },
      { name: 'Galle', city: 'Galle' },
      { name: 'Matara', city: 'Matara' },
      { name: 'Kurunegala', city: 'Kurunegala' },
      { name: 'Puttalam', city: 'Puttalam' },
      { name: 'Chilaw', city: 'Puttalam' },
      { name: 'Hambantota', city: 'Hambantota' },
      { name: 'Jaffna', city: 'Jaffna' },
      { name: 'Vavuniya', city: 'Vavuniya' },
      { name: 'Mannar', city: 'Mannar' },
      { name: 'Batticaloa', city: 'Batticaloa' },
      { name: 'Kalmunai', city: 'Batticaloa' },
      { name: 'Ampara', city: 'Ampara' },
      { name: 'Trincomalee', city: 'Trincomalee' },
      { name: 'Kilinochchi', city: 'Kilinochchi' },
      { name: 'Akkaraipattu', city: 'Ampara' },
      { name: 'Sammanthurai', city: 'Ampara' },
      { name: 'Nintavur', city: 'Ampara' },
      { name: 'Addalaichenai', city: 'Ampara' },
      { name: 'Oddamavadi', city: 'Batticaloa' },
      { name: 'Kattankudy', city: 'Batticaloa' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // CARGILLS BANK
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'cargills',
    name: 'Cargills Bank',
    branches: [
      { name: 'Colombo Fort', city: 'Colombo' },
      { name: 'Pettah', city: 'Colombo' },
      { name: 'Nugegoda', city: 'Colombo' },
      { name: 'Maharagama', city: 'Colombo' },
      { name: 'Moratuwa', city: 'Colombo' },
      { name: 'Negombo', city: 'Negombo' },
      { name: 'Kandy', city: 'Kandy' },
      { name: 'Galle', city: 'Galle' },
      { name: 'Matara', city: 'Matara' },
      { name: 'Kurunegala', city: 'Kurunegala' },
      { name: 'Ratnapura', city: 'Ratnapura' },
      { name: 'Anuradhapura', city: 'Anuradhapura' },
      { name: 'Badulla', city: 'Badulla' },
      { name: 'Hambantota', city: 'Hambantota' },
      { name: 'Jaffna', city: 'Jaffna' },
      { name: 'Vavuniya', city: 'Vavuniya' },
      { name: 'Batticaloa', city: 'Batticaloa' },
      { name: 'Trincomalee', city: 'Trincomalee' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // SANASA DEVELOPMENT BANK
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'sanasa',
    name: 'Sanasa Development Bank',
    branches: [
      { name: 'Colombo Fort', city: 'Colombo' },
      { name: 'Nugegoda', city: 'Colombo' },
      { name: 'Maharagama', city: 'Colombo' },
      { name: 'Moratuwa', city: 'Colombo' },
      { name: 'Negombo', city: 'Negombo' },
      { name: 'Gampaha', city: 'Gampaha' },
      { name: 'Mirigama', city: 'Gampaha' },
      { name: 'Veyangoda', city: 'Gampaha' },
      { name: 'Kandy', city: 'Kandy' },
      { name: 'Peradeniya', city: 'Kandy' },
      { name: 'Katugastota', city: 'Kandy' },
      { name: 'Gampola', city: 'Kandy' },
      { name: 'Nawalapitiya', city: 'Kandy' },
      { name: 'Kalutara', city: 'Kalutara' },
      { name: 'Panadura', city: 'Kalutara' },
      { name: 'Horana', city: 'Kalutara' },
      { name: 'Galle', city: 'Galle' },
      { name: 'Hikkaduwa', city: 'Galle' },
      { name: 'Ambalangoda', city: 'Galle' },
      { name: 'Matara', city: 'Matara' },
      { name: 'Weligama', city: 'Matara' },
      { name: 'Kurunegala', city: 'Kurunegala' },
      { name: 'Kuliyapitiya', city: 'Kurunegala' },
      { name: 'Narammala', city: 'Kurunegala' },
      { name: 'Ratnapura', city: 'Ratnapura' },
      { name: 'Embilipitiya', city: 'Ratnapura' },
      { name: 'Kegalle', city: 'Kegalle' },
      { name: 'Mawanella', city: 'Kegalle' },
      { name: 'Nuwara Eliya', city: 'Nuwara Eliya' },
      { name: 'Hatton', city: 'Nuwara Eliya' },
      { name: 'Badulla', city: 'Badulla' },
      { name: 'Bandarawela', city: 'Badulla' },
      { name: 'Anuradhapura', city: 'Anuradhapura' },
      { name: 'Polonnaruwa', city: 'Polonnaruwa' },
      { name: 'Matale', city: 'Matale' },
      { name: 'Dambulla', city: 'Matale' },
      { name: 'Hambantota', city: 'Hambantota' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // REGIONAL DEVELOPMENT BANK (LANKAPUTHRA)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'rdb',
    name: 'Regional Development Bank',
    branches: [
      { name: 'Colombo', city: 'Colombo' },
      { name: 'Negombo', city: 'Negombo' },
      { name: 'Gampaha', city: 'Gampaha' },
      { name: 'Mirigama', city: 'Gampaha' },
      { name: 'Kandy', city: 'Kandy' },
      { name: 'Gampola', city: 'Kandy' },
      { name: 'Nawalapitiya', city: 'Kandy' },
      { name: 'Katugastota', city: 'Kandy' },
      { name: 'Kalutara', city: 'Kalutara' },
      { name: 'Horana', city: 'Kalutara' },
      { name: 'Galle', city: 'Galle' },
      { name: 'Ambalangoda', city: 'Galle' },
      { name: 'Matara', city: 'Matara' },
      { name: 'Weligama', city: 'Matara' },
      { name: 'Kurunegala', city: 'Kurunegala' },
      { name: 'Kuliyapitiya', city: 'Kurunegala' },
      { name: 'Ratnapura', city: 'Ratnapura' },
      { name: 'Embilipitiya', city: 'Ratnapura' },
      { name: 'Balangoda', city: 'Ratnapura' },
      { name: 'Kegalle', city: 'Kegalle' },
      { name: 'Mawanella', city: 'Kegalle' },
      { name: 'Nuwara Eliya', city: 'Nuwara Eliya' },
      { name: 'Hatton', city: 'Nuwara Eliya' },
      { name: 'Badulla', city: 'Badulla' },
      { name: 'Bandarawela', city: 'Badulla' },
      { name: 'Monaragala', city: 'Monaragala' },
      { name: 'Anuradhapura', city: 'Anuradhapura' },
      { name: 'Kekirawa', city: 'Anuradhapura' },
      { name: 'Polonnaruwa', city: 'Polonnaruwa' },
      { name: 'Matale', city: 'Matale' },
      { name: 'Dambulla', city: 'Matale' },
      { name: 'Puttalam', city: 'Puttalam' },
      { name: 'Chilaw', city: 'Puttalam' },
      { name: 'Hambantota', city: 'Hambantota' },
      { name: 'Tangalle', city: 'Hambantota' },
      { name: 'Tissamaharama', city: 'Hambantota' },
      { name: 'Jaffna', city: 'Jaffna' },
      { name: 'Vavuniya', city: 'Vavuniya' },
      { name: 'Batticaloa', city: 'Batticaloa' },
      { name: 'Ampara', city: 'Ampara' },
      { name: 'Trincomalee', city: 'Trincomalee' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // MCB BANK
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'mcb',
    name: 'MCB Bank',
    branches: [
      { name: 'Colombo Fort', city: 'Colombo' },
      { name: 'Pettah', city: 'Colombo' },
      { name: 'Wellawatte', city: 'Colombo' },
      { name: 'Negombo', city: 'Negombo' },
      { name: 'Kandy', city: 'Kandy' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // STANDARD CHARTERED
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'sc',
    name: 'Standard Chartered',
    branches: [
      { name: 'Colombo Fort', city: 'Colombo' },
      { name: 'Bambalapitiya', city: 'Colombo' },
      { name: 'Nugegoda', city: 'Colombo' },
      { name: 'Kandy', city: 'Kandy' },
      { name: 'Galle', city: 'Galle' },
      { name: 'Negombo', city: 'Negombo' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // HSBC
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'hsbc',
    name: 'HSBC',
    branches: [
      { name: 'Colombo Fort', city: 'Colombo' },
      { name: 'Bambalapitiya', city: 'Colombo' },
      { name: 'Rajagiriya', city: 'Colombo' },
      { name: 'Kandy', city: 'Kandy' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // CITIBANK
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'citi',
    name: 'Citibank',
    branches: [
      { name: 'Colombo Fort', city: 'Colombo' },
      { name: 'Kollupitiya', city: 'Colombo' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // DEUTSCHE BANK
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'deutsche',
    name: 'Deutsche Bank',
    branches: [
      { name: 'Colombo Fort', city: 'Colombo' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // HABIB BANK
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'habib',
    name: 'Habib Bank',
    branches: [
      { name: 'Colombo Fort', city: 'Colombo' },
      { name: 'Pettah', city: 'Colombo' },
      { name: 'Wellawatte', city: 'Colombo' },
      { name: 'Kandy', city: 'Kandy' },
      { name: 'Jaffna', city: 'Jaffna' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // INDIAN BANK
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'indian-bank',
    name: 'Indian Bank',
    branches: [
      { name: 'Colombo Fort', city: 'Colombo' },
      { name: 'Pettah', city: 'Colombo' },
      { name: 'Kandy', city: 'Kandy' },
      { name: 'Jaffna', city: 'Jaffna' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // INDIAN OVERSEAS BANK
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'iob',
    name: 'Indian Overseas Bank',
    branches: [
      { name: 'Colombo Fort', city: 'Colombo' },
      { name: 'Pettah', city: 'Colombo' },
      { name: 'Kandy', city: 'Kandy' },
      { name: 'Jaffna', city: 'Jaffna' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // BANK OF INDIA
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'bank-of-india',
    name: 'Bank of India',
    branches: [
      { name: 'Colombo Fort', city: 'Colombo' },
      { name: 'Pettah', city: 'Colombo' },
      { name: 'Kandy', city: 'Kandy' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // BANK OF BARODA
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'bank-of-baroda',
    name: 'Bank of Baroda',
    branches: [
      { name: 'Colombo Fort', city: 'Colombo' },
      { name: 'Pettah', city: 'Colombo' },
      { name: 'Kandy', city: 'Kandy' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // STATE BANK OF INDIA
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'sbi',
    name: 'State Bank of India',
    branches: [
      { name: 'Colombo Fort', city: 'Colombo' },
      { name: 'Wellawatte', city: 'Colombo' },
      { name: 'Kandy', city: 'Kandy' },
    ],
  },
];
