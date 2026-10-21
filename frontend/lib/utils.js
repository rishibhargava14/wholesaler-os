const pageTitles = {
  "/dashboard": {
    title: "Dashboard",
    description: "Overview of your wholesale business.",
  },

  "/products": {
    title: "Products",
    description: "Manage your products, pricing, and stock.",
  },

  "/products/new": {
    title: "Add Product",
    description: "Add a new product to your inventory.",
  },

  "/customers": {
    title: "Customers",
    description: "Manage your wholesale customers and credit accounts.",
  },

  "/customers/new": {
    title: "Add Customer",
    description: "Add a new customer to your wholesale workspace.",
  },

  "/orders": {
    title: "Orders",
    description: "Create and manage customer orders.",
  },

  "/orders/new": {
    title: "Create Order",
    description: "Create a new order for a customer.",
  },

  "/pricelists": {
    title: "Price Lists",
    description: "Manage retail, wholesale, VIP, and custom product pricing.",
  },

  "/pricelists/new": {
    title: "Create Price List",
    description: "Create a new price list with custom product prices.",
  },

  "/ledger": {
    title: "Ledger",
    description: "Track customer payments, credits, and outstanding balances.",
  },

  "/stock": {
    title: "Stock",
    description: "Track inventory movements and manage stock levels.",
  },

  "/settings": {
    title: "Settings",
    description: "Manage your wholesale business settings and preferences.",
  },
};

export const getPageTitle = (pathname) => {
  if (pageTitles[pathname]) {
    return pageTitles[pathname];
  }

  if (pathname.startsWith("/products/")) {
    return {
      title: pathname.endsWith("/edit") ? "Edit Product" : "Product Details",
      description: pathname.endsWith("/edit")
        ? "Update product information, pricing, and stock."
        : "View product information, pricing, and stock.",
    };
  }

  if (pathname.startsWith("/customers/")) {
    return {
      title: pathname.endsWith("/edit")
        ? "Edit Customer"
        : "Customer Details",
      description: pathname.endsWith("/edit")
        ? "Update customer information and credit settings."
        : "View customer information, ledger, and outstanding balance.",
    };
  }

  if (pathname.startsWith("/orders/")) {
    return {
      title: pathname.endsWith("/edit") ? "Edit Order" : "Order Details",
      description: pathname.endsWith("/edit")
        ? "Update order details and status."
        : "View order details, payment, and delivery status.",
    };
  }

  if (pathname.startsWith("/pricelists/")) {
    return {
      title: pathname.endsWith("/edit")
        ? "Edit Price List"
        : "Price List Details",
      description: pathname.endsWith("/edit")
        ? "Update price list discounts and custom product prices."
        : "View products and pricing for this price list.",
    };
  }

  if (pathname.startsWith("/ledger/")) {
    return {
      title: "Customer Ledger",
      description: "View customer transactions, payments, and outstanding balance.",
    };
  }

  if (pathname.startsWith("/stock/")) {
    return {
      title: "Stock Details",
      description: "View stock movements and inventory history.",
    };
  }

  return {
    title: "Wholesaler OS",
    description: "Manage your wholesale business.",
  };
};

export const getInitials = (name = "") => {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "AD"
  );
}