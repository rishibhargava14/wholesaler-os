const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");

// Helper to format WhatsApp message template based on type and language
function buildWhatsAppMessage({
  type,
  language = "English",
  orderNo,
  items = [],
  total,
  outstanding,
  upiLink,
  creditDueDate,
  companyName = "Wholesaler",
}) {
  const isMarathi = language === "Marathi";
  const isHindi = language === "Hindi";

  const formattedDueDate = creditDueDate
    ? new Date(creditDueDate).toLocaleDateString("en-IN")
    : "—";

  switch (type) {
    case "order-confirmed":
      if (isMarathi) {
        return (
          `*${companyName} - ऑर्डर निश्चित झाली!*\n\n` +
          `नमस्कार, आपली ऑर्डर *${orderNo}* नोंदवण्यात आली आहे.\n` +
          `एकूण रक्कम: ₹${total}\n` +
          (outstanding ? `थकबाकी: ₹${outstanding}\n` : "") +
          (creditDueDate ? `क्रेडिट देय तारीख: ${formattedDueDate}\n` : "") +
          (upiLink ? `ऑनलाइन पेमेंट लिंक: ${upiLink}\n` : "") +
          `धन्यवाद!`
        );
      } else if (isHindi) {
        return (
          `*${companyName} - ऑर्डर कन्फर्म हो गई है!*\n\n` +
          `नमस्ते, आपका ऑर्डर *${orderNo}* दर्ज कर लिया गया है।\n` +
          `कुल राशि: ₹${total}\n` +
          (outstanding ? `बकाया राशि: ₹${outstanding}\n` : "") +
          (creditDueDate ? `क्रेडिट देय तिथि: ${formattedDueDate}\n` : "") +
          (upiLink ? `भुगतान लिंक: ${upiLink}\n` : "") +
          `धन्यवाद!`
        );
      } else {
        return (
          `*${companyName} - Order Confirmed!*\n\n` +
          `Hello, your order *${orderNo}* has been confirmed.\n` +
          `Total Amount: ₹${total}\n` +
          (outstanding ? `Outstanding Balance: ₹${outstanding}\n` : "") +
          (creditDueDate ? `Credit Due Date: ${formattedDueDate}\n` : "") +
          (upiLink ? `Pay via UPI: ${upiLink}\n` : "") +
          `Thank you for your business!`
        );
      }

    case "credit-reminder":
      if (isMarathi) {
        return (
          `*${companyName} - पेमेंट स्मरणपत्र*\n\n` +
          `नमस्कार, आपली उधारी शिल्लक रक्कम *₹${outstanding}* देय आहे.\n` +
          `शेवटची तारीख: ${formattedDueDate}\n` +
          (upiLink ? `कृपया त्वरित पेमेंट करा: ${upiLink}\n` : "") +
          `सहकार्याबद्दल धन्यवाद.`
        );
      } else if (isHindi) {
        return (
          `*${companyName} - भुगतान स्मरण पत्र*\n\n` +
          `नमस्ते, आपकी क्रेडिट बकाया राशि *₹${outstanding}* देय है।\n` +
          `अंतिम तिथि: ${formattedDueDate}\n` +
          (upiLink ? `कृपया तुरंत भुगतान करें: ${upiLink}\n` : "") +
          `सहयोग के लिए धन्यवाद।`
        );
      } else {
        return (
          `*${companyName} - Payment Reminder*\n\n` +
          `Hello, this is a friendly reminder that your credit balance of *₹${outstanding}* is due.\n` +
          `Due Date: ${formattedDueDate}\n` +
          (upiLink ? `Pay now via UPI: ${upiLink}\n` : "") +
          `Thank you.`
        );
      }

    case "low-stock":
      if (isMarathi) {
        return (
          `*${companyName} - कमी स्टॉक सूचना!*\n\n` +
          `सावध रहा: आपल्या गोदामातील काही उत्पादने कमी स्टॉक पातळीवर पोहोचली आहेत.\n` +
          `कृपया नवीन ऑर्डर देऊन स्टॉक रीफिल करा.`
        );
      } else if (isHindi) {
        return (
          `*${companyName} - कम स्टॉक अलर्ट!*\n\n` +
          `ध्यान दें: आपके इन्वेंट्री में कुछ उत्पाद न्यूनतम स्टॉक सीमा तक पहुँच चुके हैं।\n` +
          `कृपया जल्द ही स्टॉक रीफिल करें।`
        );
      } else {
        return (
          `*${companyName} - Low Stock Alert!*\n\n` +
          `Notice: Several inventory items have reached or dropped below their minimum stock threshold.\n` +
          `Please check stock and place replenishment orders.`
        );
      }

    case "invoice":
    default:
      if (isMarathi) {
        return (
          `*${companyName} - बिल / पावती*\n\n` +
          `ऑर्डर क्रमांक: ${orderNo}\n` +
          `एकूण बिल: ₹${total}\n` +
          (outstanding ? `चालू थकबाकी: ₹${outstanding}\n` : "") +
          (upiLink ? `UPI द्वारे पैसे भरा: ${upiLink}\n` : "") +
          `धन्यवाद!`
        );
      } else if (isHindi) {
        return (
          `*${companyName} - बिल / चालान*\n\n` +
          `ऑर्डर संख्या: ${orderNo}\n` +
          `कुल बिल: ₹${total}\n` +
          (outstanding ? `वर्तमान बकाया: ₹${outstanding}\n` : "") +
          (upiLink ? `UPI द्वारा भुगतान करें: ${upiLink}\n` : "") +
          `धन्यवाद!`
        );
      } else {
        return (
          `*${companyName} - Invoice / Receipt*\n\n` +
          `Order No: ${orderNo}\n` +
          `Invoice Total: ₹${total}\n` +
          (outstanding ? `Current Outstanding: ₹${outstanding}\n` : "") +
          (upiLink ? `Pay via UPI: ${upiLink}\n` : "") +
          `Thank you!`
        );
      }
  }
}

// @desc    Send WhatsApp message (Marathi/Hindi/English)
// @route   POST /api/whatsapp/send
// @access  Private
router.post("/send", protect, async (req, res) => {
  try {
    const {
      type = "order-confirmed",
      phone,
      orderNo,
      items,
      total,
      outstanding,
      upiLink,
      creditDueDate,
      language,
    } = req.body;

    const companyName = req.company?.name || "Wholesaler OS";
    const selectedLanguage =
      language || req.company?.settings?.language || "English";

    const formattedMessage = buildWhatsAppMessage({
      type,
      language: selectedLanguage,
      orderNo,
      items,
      total,
      outstanding,
      upiLink: upiLink || (req.company?.settings?.upiId ? `upi://pay?pa=${req.company.settings.upiId}&pn=${encodeURIComponent(companyName)}&am=${total}&cu=INR` : ""),
      creditDueDate,
      companyName,
    });

    // In production with a WhatsApp API token, call the provider API (e.g. WhatsApp Business Cloud API)
    // For local and sandbox testing, return the formatted payload and message ID
    const messageId = `wa_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    res.json({
      success: true,
      messageId,
      phone,
      type,
      language: selectedLanguage,
      message: formattedMessage,
      status: "sent",
    });
  } catch (error) {
    console.error("WhatsApp send error:", error);
    res.status(500).json({
      message: error.message || "Failed to send WhatsApp message.",
    });
  }
});

module.exports = router;
