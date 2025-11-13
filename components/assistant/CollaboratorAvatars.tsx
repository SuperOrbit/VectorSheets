import React from 'react';
import type { Collaborator } from '../../types';

interface CollaboratorAvatarsProps {
  collaborators: Collaborator[];
  isDarkMode: boolean;
}

export const CollaboratorAvatars: React.FC<CollaboratorAvatarsProps> = ({
  collaborators,
  isDarkMode,
}) => {
  if (!collaborators || collaborators.length === 0) return null;

  const activeCollaborators = collaborators.filter(c => c.isActive);

  if (activeCollaborators.length === 0) return null;

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (id: string): string => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-yellow-500',
      'bg-indigo-500',
    ];
    const index = id.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b border-[#2D2D2D] bg-[#0D0D0D]">
      <span className="text-xs text-[#9CA3AF]">Active:</span>
      <div className="flex items-center gap-1.5">
        {activeCollaborators.slice(0, 5).map((collaborator) => (
          <div
            key={collaborator.id}
            className="relative group"
            title={collaborator.name}
            aria-label={`Active collaborator: ${collaborator.name}`}
          >
            {collaborator.avatar ? (
              <img
                src={collaborator.avatar}
                alt={collaborator.name}
                className="w-6 h-6 rounded-full border-2 border-[#2D2D2D] hover:border-[#3B3B3B] transition-colors"
              />
            ) : (
              <div
                className={`w-6 h-6 rounded-full border-2 border-[#2D2D2D] hover:border-[#3B3B3B] transition-colors ${getAvatarColor(
                  collaborator.id
                )} flex items-center justify-center text-xs font-medium text-white`}
              >
                {getInitials(collaborator.name)}
              </div>
            )}
            <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-[#0D0D0D]"></div>
          </div>
        ))}
        {activeCollaborators.length > 5 && (
          <div className="w-6 h-6 rounded-full border-2 border-[#2D2D2D] bg-[#1A1A1A] flex items-center justify-center text-xs text-[#9CA3AF]">
            +{activeCollaborators.length - 5}
          </div>
        )}
      </div>
    </div>
  );
};

