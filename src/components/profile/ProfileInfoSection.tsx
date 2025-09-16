'use client';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ProfileInfoSectionProps {
  user: User;
}

export default function ProfileInfoSection({ user }: ProfileInfoSectionProps) {
  return (
    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
      <h1 className="text-2xl font-bold text-white mb-6">Profile Information</h1>

      <div className="space-y-4">
        <div className="flex items-center justify-between py-2 border-b border-white/10">
          <span className="text-gray-300 font-medium">Username:</span>
          <span className="text-white">{user.username}</span>
        </div>

        <div className="flex items-center justify-between py-2 border-b border-white/10">
          <span className="text-gray-300 font-medium">Email:</span>
          <span className="text-white">{user.email}</span>
        </div>

        <div className="flex items-center justify-between py-2 border-b border-white/10">
          <span className="text-gray-300 font-medium">Role:</span>
          <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
            user.role === 'admin'
              ? 'bg-purple-500/20 text-purple-400'
              : 'bg-blue-500/20 text-blue-400'
          }`}>
            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
          </span>
        </div>

        <div className="flex items-center justify-between py-2 border-b border-white/10">
          <span className="text-gray-300 font-medium">Status:</span>
          <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
            user.isActive
              ? 'bg-green-500/20 text-green-400'
              : 'bg-red-500/20 text-red-400'
          }`}>
            {user.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>

        <div className="flex items-center justify-between py-2 border-b border-white/10">
          <span className="text-gray-300 font-medium">Member Since:</span>
          <span className="text-white">
            {new Date(user.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </span>
        </div>

        <div className="flex items-center justify-between py-2">
          <span className="text-gray-300 font-medium">Last Updated:</span>
          <span className="text-white">
            {new Date(user.updatedAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </span>
        </div>
      </div>
    </div>
  );
}