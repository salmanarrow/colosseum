import { getAllRegistrations, getTicketProducts } from "../actions";
import RegistrationManager, { type Registration, type TicketProduct } from "./RegistrationManager";

export const dynamic = "force-dynamic";

export default async function RegistrationsPage() {
  const [registrations, products] = await Promise.all([
    getAllRegistrations(),
    getTicketProducts(),
  ]);

  return (
    <RegistrationManager
      registrations={registrations as unknown as Registration[]}
      products={products as unknown as TicketProduct[]}
    />
  );
}
