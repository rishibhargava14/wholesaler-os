export const mockPriceLists = [
  {
    _id: "pl1",
    name: "Retail",
    discountPercent: 0,
    products: [],
  },
  {
    _id: "pl2",
    name: "Wholesale",
    discountPercent: 5,
    products: [
      {
        productId: "p1",
        customPrice: 1825,
      },
      {
        productId: "p2",
        customPrice: 705,
      },
      {
        productId: "p3",
        customPrice: 2400,
      },
    ],
  },
  {
    _id: "pl3",
    name: "VIP",
    discountPercent: 8,
    products: [
      {
        productId: "p1",
        customPrice: 1780,
      },
      {
        productId: "p2",
        customPrice: 690,
      },
      {
        productId: "p4",
        customPrice: 495,
      },
      {
        productId: "p5",
        customPrice: 138,
      },
    ],
  },
];