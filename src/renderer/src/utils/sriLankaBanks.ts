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
  {
    id: 'com-bank',
    name: 'Commercial Bank of Ceylon',
    branches: [
      { name: 'Colombo Fort', city: 'Colombo' },
      { name: 'Kandy', city: 'Kandy' },
      { name: 'Galle', city: 'Galle' },
      { name: 'Jaffna', city: 'Jaffna' },
      { name: 'Matara', city: 'Matara' },
      { name: 'Kurunegala', city: 'Kurunegala' },
      { name: 'Negombo', city: 'Negombo' },
      { name: 'Badulla', city: 'Badulla' },
      { name: 'Ratnapura', city: 'Ratnapura' },
      { name: 'Anuradhapura', city: 'Anuradhapura' },
    ],
  },
  {
    id: 'boc',
    name: 'Bank of Ceylon',
    branches: [
      { name: 'Colombo Fort', city: 'Colombo' },
      { name: 'Kandy City', city: 'Kandy' },
      { name: 'Galle', city: 'Galle' },
      { name: 'Jaffna', city: 'Jaffna' },
      { name: 'Matara', city: 'Matara' },
      { name: 'Kurunegala', city: 'Kurunegala' },
      { name: 'Negombo', city: 'Negombo' },
      { name: 'Batticaloa', city: 'Batticaloa' },
      { name: 'Trincomalee', city: 'Trincomalee' },
      { name: 'Nuwara Eliya', city: 'Nuwara Eliya' },
    ],
  },
  {
    id: 'sampath',
    name: 'Sampath Bank',
    branches: [
      { name: 'Colombo Fort', city: 'Colombo' },
      { name: 'Kandy', city: 'Kandy' },
      { name: 'Galle', city: 'Galle' },
      { name: 'Matara', city: 'Matara' },
      { name: 'Kurunegala', city: 'Kurunegala' },
      { name: 'Negombo', city: 'Negombo' },
      { name: 'Ratnapura', city: 'Ratnapura' },
      { name: 'Anuradhapura', city: 'Anuradhapura' },
      { name: 'Pettah', city: 'Colombo' },
      { name: 'Nugegoda', city: 'Colombo' },
    ],
  },
  {
    id: 'hnb',
    name: 'Hatton National Bank',
    branches: [
      { name: 'Colombo Fort', city: 'Colombo' },
      { name: 'Kandy', city: 'Kandy' },
      { name: 'Galle', city: 'Galle' },
      { name: 'Jaffna', city: 'Jaffna' },
      { name: 'Matara', city: 'Matara' },
      { name: 'Kurunegala', city: 'Kurunegala' },
      { name: 'Nuwara Eliya', city: 'Nuwara Eliya' },
      { name: 'Hatton', city: 'Hatton' },
      { name: 'Badulla', city: 'Badulla' },
      { name: 'Negombo', city: 'Negombo' },
    ],
  },
  {
    id: 'seylan',
    name: 'Seylan Bank',
    branches: [
      { name: 'Colombo Fort', city: 'Colombo' },
      { name: 'Kandy', city: 'Kandy' },
      { name: 'Galle', city: 'Galle' },
      { name: 'Matara', city: 'Matara' },
      { name: 'Kurunegala', city: 'Kurunegala' },
      { name: 'Negombo', city: 'Negombo' },
      { name: 'Ratnapura', city: 'Ratnapura' },
      { name: 'Anuradhapura', city: 'Anuradhapura' },
      { name: 'Batticaloa', city: 'Batticaloa' },
      { name: 'Wellawatte', city: 'Colombo' },
    ],
  },
  {
    id: 'nsb',
    name: 'National Savings Bank',
    branches: [
      { name: 'Colombo Fort', city: 'Colombo' },
      { name: 'Kandy', city: 'Kandy' },
      { name: 'Galle', city: 'Galle' },
      { name: 'Jaffna', city: 'Jaffna' },
      { name: 'Matara', city: 'Matara' },
      { name: 'Kurunegala', city: 'Kurunegala' },
      { name: 'Negombo', city: 'Negombo' },
      { name: 'Anuradhapura', city: 'Anuradhapura' },
      { name: 'Badulla', city: 'Badulla' },
      { name: 'Ratnapura', city: 'Ratnapura' },
    ],
  },
  {
    id: 'peoples',
    name: "People's Bank",
    branches: [
      { name: 'Colombo Fort', city: 'Colombo' },
      { name: 'Kandy', city: 'Kandy' },
      { name: 'Galle', city: 'Galle' },
      { name: 'Jaffna', city: 'Jaffna' },
      { name: 'Matara', city: 'Matara' },
      { name: 'Kurunegala', city: 'Kurunegala' },
      { name: 'Negombo', city: 'Negombo' },
      { name: 'Trincomalee', city: 'Trincomalee' },
      { name: 'Batticaloa', city: 'Batticaloa' },
      { name: 'Anuradhapura', city: 'Anuradhapura' },
    ],
  },
  {
    id: 'dfcc',
    name: 'DFCC Bank',
    branches: [
      { name: 'Colombo Fort', city: 'Colombo' },
      { name: 'Kandy', city: 'Kandy' },
      { name: 'Galle', city: 'Galle' },
      { name: 'Matara', city: 'Matara' },
      { name: 'Kurunegala', city: 'Kurunegala' },
      { name: 'Negombo', city: 'Negombo' },
      { name: 'Ratnapura', city: 'Ratnapura' },
      { name: 'Badulla', city: 'Badulla' },
    ],
  },
  {
    id: 'ntb',
    name: 'Nations Trust Bank',
    branches: [
      { name: 'Colombo Fort', city: 'Colombo' },
      { name: 'Kandy', city: 'Kandy' },
      { name: 'Galle', city: 'Galle' },
      { name: 'Matara', city: 'Matara' },
      { name: 'Kurunegala', city: 'Kurunegala' },
      { name: 'Negombo', city: 'Negombo' },
      { name: 'Wattala', city: 'Colombo' },
      { name: 'Nugegoda', city: 'Colombo' },
    ],
  },
  {
    id: 'union',
    name: 'Union Bank of Colombo',
    branches: [
      { name: 'Colombo Fort', city: 'Colombo' },
      { name: 'Kandy', city: 'Kandy' },
      { name: 'Galle', city: 'Galle' },
      { name: 'Matara', city: 'Matara' },
      { name: 'Negombo', city: 'Negombo' },
      { name: 'Kurunegala', city: 'Kurunegala' },
    ],
  },
  {
    id: 'pan-asia',
    name: 'Pan Asia Bank',
    branches: [
      { name: 'Colombo Fort', city: 'Colombo' },
      { name: 'Kandy', city: 'Kandy' },
      { name: 'Galle', city: 'Galle' },
      { name: 'Matara', city: 'Matara' },
      { name: 'Negombo', city: 'Negombo' },
      { name: 'Kurunegala', city: 'Kurunegala' },
      { name: 'Anuradhapura', city: 'Anuradhapura' },
    ],
  },
  {
    id: 'amana',
    name: 'Amana Bank',
    branches: [
      { name: 'Colombo Fort', city: 'Colombo' },
      { name: 'Kandy', city: 'Kandy' },
      { name: 'Galle', city: 'Galle' },
      { name: 'Matara', city: 'Matara' },
      { name: 'Negombo', city: 'Negombo' },
      { name: 'Puttalam', city: 'Puttalam' },
    ],
  },
  {
    id: 'mcb',
    name: 'MCB Bank',
    branches: [
      { name: 'Colombo Fort', city: 'Colombo' },
      { name: 'Kandy', city: 'Kandy' },
      { name: 'Negombo', city: 'Negombo' },
    ],
  },
  {
    id: 'sc',
    name: 'Standard Chartered',
    branches: [
      { name: 'Colombo Fort', city: 'Colombo' },
      { name: 'Kandy', city: 'Kandy' },
      { name: 'Galle', city: 'Galle' },
      { name: 'Negombo', city: 'Negombo' },
    ],
  },
  {
    id: 'hsbc',
    name: 'HSBC',
    branches: [
      { name: 'Colombo Fort', city: 'Colombo' },
      { name: 'Kandy', city: 'Kandy' },
    ],
  },
  {
    id: 'citi',
    name: 'Citi Bank',
    branches: [
      { name: 'Colombo Fort', city: 'Colombo' },
    ],
  },
  {
    id: 'deutsche',
    name: 'Deutsche Bank',
    branches: [
      { name: 'Colombo Fort', city: 'Colombo' },
    ],
  },
];
