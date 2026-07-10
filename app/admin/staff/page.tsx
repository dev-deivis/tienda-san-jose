import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AgregarStaffModal, EditStaffModal, DeleteStaffModal } from '@/app/admin/_components/staff-modals';

export default async function AdminStaffPage() {
  const session = await getSessionUser();
  if (!session || session.role !== 'ADMIN') {
    redirect('/admin');
  }

  const staffUsers = await prisma.user.findMany({
    where: { role: { in: ['STAFF', 'ADMIN'] } },
    select: {
      id: true,
      nombre: true,
      email: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const serialized = staffUsers.map((u) => ({
    id: u.id,
    nombre: u.nombre,
    email: u.email,
    role: u.role as 'STAFF' | 'ADMIN',
    createdAt: u.createdAt.toISOString(),
  }));

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-gray-800">Gestión de Staff</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {serialized.length} miembro{serialized.length !== 1 ? 's' : ''} del equipo
          </p>
        </div>
        <AgregarStaffModal />
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {serialized.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">
            No hay miembros del equipo registrados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nombre</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Rol</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Desde</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {serialized.map((user) => (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-gray-800">
                        {user.nombre ?? <span className="text-gray-400 italic">Sin nombre</span>}
                      </span>
                      {user.id === session.userId && (
                        <span className="ml-2 text-xs text-brand-purple font-medium">(tú)</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          user.role === 'ADMIN'
                            ? 'bg-brand-purple text-white'
                            : 'bg-brand-gold/20 text-amber-800'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDate(user.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <EditStaffModal user={user} />
                        <DeleteStaffModal user={user} currentUserId={session.userId} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
