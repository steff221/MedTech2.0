// Страница (Next.js): почетен дел за администратор.
import { redirect } from "next/navigation";

export default function AdminRoot() {
  redirect("/admin/dashboard");
}
