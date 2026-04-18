export const POSITION_LIBRARY = [
  {
    keywords: ["gym", "fitness", "recreation", "rec center"],
    positions: ["Front Desk", "Fitness Attendant", "Equipment Staff", "Lifeguard", "Intramural Assistant"],
  },
  {
    keywords: ["library", "study", "learning"],
    positions: ["Library Assistant", "Circulation Desk", "Stacks Assistant", "Tech Help Desk", "Research Support"],
  },
  {
    keywords: ["cafe", "coffee", "restaurant", "dining", "food"],
    positions: ["Cashier", "Server", "Cook", "Barista", "Prep Staff"],
  },
  {
    keywords: ["office", "administration", "front desk", "student center"],
    positions: ["Front Desk", "Office Assistant", "Reception", "Student Services Assistant", "Administrative Aide"],
  },
  {
    keywords: ["lab", "technology", "it", "computer"],
    positions: ["Lab Assistant", "IT Support", "Tech Monitor", "Equipment Checkout", "Help Desk"],
  },
];

export const extractPositionOptions = (niche) => {
  const normalized = String(niche || "").toLowerCase();
  const matched = POSITION_LIBRARY.find((entry) =>
    entry.keywords.some((keyword) => normalized.includes(keyword)),
  );
  return matched?.positions || ["General Staff", "Front Desk", "Support Staff", "Shift Lead"];
};

export const getAllPositions = () => {
  const uniquePositions = new Set();
  POSITION_LIBRARY.forEach((entry) => {
    entry.positions.forEach((pos) => uniquePositions.add(pos));
  });
  return Array.from(uniquePositions).sort();
};
