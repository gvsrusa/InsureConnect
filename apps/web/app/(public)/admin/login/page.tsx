import { redirect } from "next/navigation";

export default function AdminLoginPage(): never {
  redirect("/login?portal=admin&redirect=/admin/roles");
}
