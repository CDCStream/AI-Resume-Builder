// Format date from "2026-06" to "Jun 2026" or "2026-06-15" to "Jun 15, 2026"
export const formatDate = (date?: string) => {
  if (!date) return "";
  if (date === "Present") return "Present";
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const parts = date.split("-");
  
  // Format: YYYY-MM-DD (birth date format) -> "May 14, 1996"
  if (parts.length === 3) {
    const year = parts[0];
    const monthIndex = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    if (monthIndex >= 0 && monthIndex < 12) {
      return `${months[monthIndex]} ${day}, ${year}`;
    }
  }
  
  // Format: YYYY-MM (work/education date format) -> "Jun 2026"
  if (parts.length === 2) {
    const year = parts[0];
    const monthIndex = parseInt(parts[1], 10) - 1;
    if (monthIndex >= 0 && monthIndex < 12) {
      return `${months[monthIndex]} ${year}`;
    }
  }
  return date;
};



