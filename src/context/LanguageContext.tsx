import { createContext, useState, ReactNode, useContext, useEffect } from 'react';

// Very simple translation dictionary
const translations: Record<string, Record<string, string>> = {
  en: {
    "Tajer": "Tajer ",
    "Dashboard": "Dashboard",
    "Accounts": "Accounts",
    "Inventory": "Inventory",
    "Settings": "Settings",
    "Logout": "Logout",
    "Exchange Rate": "Exchange Rate",
    "Tajer Management System": "Tajer Management System",
    // Dashboard
    "Dashboard Overview": "Dashboard Overview",
    "Total Cash in Drawer": "Total Cash in Drawer",
    "Total Stock Value": "Total Stock Value",
    "Total Debt Owed To Us": "Total Debt Owed To Us",
    "Total Debt Owed By Us": "Total Debt Owed By Us",
    // Accounts
    "New Account": "New Account",
    "Search accounts by name or phone...": "Search accounts by name or phone...",
    "Create New Account": "Create New Account",
    "Customer (Zaboon)": "Customer (Zaboon)",
    "Merchant (Tajer)": "Merchant (Tajer)",
    "Name": "Name",
    "Phone Number": "Phone Number",
    "Save Account": "Save Account",
    "Account Type": "Account Type",
    "Settled": "Settled",
    "Debt ↑": "Debt ↑",
    "You Owe": "You Owe",
    "They Owe Us": "They Owe Us",
    "We Owe Them": "We Owe Them",
    "No phone provided": "No phone provided",
    "Net Balance": "Net Balance",
    "No accounts found. Create one to start recording transactions.": "No accounts found. Create one to start recording transactions.",
    // Details & Actions
    "Account Details": "Account Details",
    "Add Item": "Add Item",
    "Item Name": "Item Name",
    "Starting Quantity": "Starting Quantity",
    "Quantity": "Quantity",
    "Purchase Price": "Purchase Price",
    "Avg Purchase Price": "Avg Purchase Price",
    "Currency": "Currency",
    "Purchase Price (USD)": "Purchase Price (USD)",
    "Avg Purchase Price (USD)": "Avg Purchase Price (USD)",
    "Total Cost Value": "Total Cost Value",
    "Actions": "Actions",
    "No inventory items found. Add some!": "No inventory items found. Add some!",
    "Search items by name...": "Search items by name...",
    "Edit Profile": "Edit Profile",
    "Delete Account": "Delete Account",
    "Edit Account Settings": "Edit Account Settings",
    "Save": "Save",
    "Cancel": "Cancel",
    "Are you sure you want to delete this account and ALL its transactions? This cannot be undone.": "Are you sure you want to delete this account and ALL its transactions? This cannot be undone.",
    "Are you sure you want to delete this item?": "Are you sure you want to delete this item?",
    "Are you sure you want to delete this transaction? This will revert account balances and items inventory.": "Are you sure you want to delete this transaction? This will revert account balances and items inventory.",
    "No transactions recorded yet.": "No transactions recorded yet.",
    "Back to Accounts": "Back to Accounts",
    "Current Debt Status": "Current Debt Status",
    "Record New Transaction": "Record New Transaction",
    "New Transaction": "New Transaction",
    "Edit Transaction": "Edit Transaction",
    "Transaction Type": "Transaction Type",
    "Items": "Items",
    "Cash Received (In)": "Cash Received (In)",
    "Cash Given (Out)": "Cash Given (Out)",
    "Save Transaction": "Save Transaction",
    "Transaction History": "Transaction History"
  },
  ar: {
    "Tajer": "تاجر",
    "Dashboard": "لوحة القيادة",
    "Accounts": "الحسابات",
    "Inventory": "المخزن",
    "Settings": "الإعدادات",
    "Logout": "تسجيل الخروج",
    "Exchange Rate": "سعر الصرف",
    "Tajer Management System": "نظام تاجر للإدارة",
    "Dashboard Overview": "ملخص لوحة القيادة",
    "Total Cash in Drawer": "إجمالي النقد في الصندوق",
    "Total Stock Value": "إجمالي قيمة المخزون",
    "Total Debt Owed To Us": "إجمالي الديون (لنا)",
    "Total Debt Owed By Us": "إجمالي الديون (علينا)",
    "New Account": "حساب جديد",
    "Search accounts by name or phone...": "ابحث عن الحسابات بالاسم أو الهاتف...",
    "Create New Account": "إنشاء حساب جديد",
    "Customer (Zaboon)": "زبون",
    "Merchant (Tajer)": "تاجر",
    "Name": "الاسم",
    "Phone Number": "رقم الهاتف",
    "Save Account": "حفظ الحساب",
    "Account Type": "نوع الحساب",
    "Settled": "مسوى",
    "Debt ↑": "مطلوب ↑",
    "You Owe": "نحن مدينون",
    "They Owe Us": "هم مدينون لنا",
    "We Owe Them": "نحن مدينون لهم",
    "No phone provided": "لا يوجد رقم هاتف",
    "Net Balance": "الرصيد الصافي",
    "No accounts found. Create one to start recording transactions.": "لم يتم العثور على حسابات، قم بإنشاء حساب للبدء.",
    "Account Details": "تفاصيل الحساب",
    "Add Item": "إضافة مادة",
    "Item Name": "اسم المادة",
    "Starting Quantity": "الكمية الأولية",
    "Quantity": "الكمية",
    "Purchase Price": "سعر الشراء",
    "Avg Purchase Price": "متوسط سعر الشراء",
    "Currency": "العملة",
    "Purchase Price (USD)": "سعر الشراء (دولار)",
    "Avg Purchase Price (USD)": "متوسط سعر الشراء (دولار)",
    "Total Cost Value": "القيمة الإجمالية",
    "Actions": "إجراءات",
    "No inventory items found. Add some!": "لا توجد مواد في المخزن. أضف بعضها!",
    "Search items by name...": "ابحث عن المواد بالاسم...",
    "Edit Profile": "تعديل الحساب",
    "Delete Account": "حذف الحساب",
    "Edit Account Settings": "تعديل إعدادات الحساب",
    "Save": "حفظ",
    "Cancel": "إلغاء",
    "Are you sure you want to delete this account and ALL its transactions? This cannot be undone.": "هل أنت متأكد من حذف الحساب وجميع حركاته؟ لا يمكن التراجع عن هذا.",
    "Are you sure you want to delete this item?": "هل أنت متأكد من حذف هذه المادة؟",
    "Are you sure you want to delete this transaction? This will revert account balances and items inventory.": "هل أنت متأكد من حذف هذه المعاملة؟ سيؤدي ذلك إلى التراجع عن أرصدة الحساب وجرد المواد.",
    "No transactions recorded yet.": "لا توجد معاملات مسجلة بعد.",
    "Back to Accounts": "العودة إلى الحسابات",
    "Current Debt Status": "حالة الدين الحالية",
    "Record New Transaction": "تسجيل معاملة جديدة",
    "New Transaction": "معاملة جديدة",
    "Edit Transaction": "تعديل المعاملة",
    "Transaction Type": "نوع المعاملة",
    "Items": "المواد",
    "Cash Received (In)": "النقد المستلم (وارد)",
    "Cash Given (Out)": "النقد المدفوع (صادر)",
    "Save Transaction": "حفظ المعاملة",
    "Transaction History": "سجل المعاملات"
  }
};

type Language = 'en' | 'ar';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  dir: 'ltr' | 'rtl';
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>((localStorage.getItem('lang') as Language) || 'en');

  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
  }, [lang, dir]);

  const changeLang = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('lang', newLang);
  };

  const t = (key: string): string => {
    return translations[lang]?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang: changeLang, dir, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
}
