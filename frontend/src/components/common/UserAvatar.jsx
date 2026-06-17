import { getInitials, getAvatarColor } from '../../utils/taskDetailUtils';

/**
 * UserAvatar
 *
 * Props:
 *   name    – display name
 *   avatar  – optional image URL
 *   size    – 'xs' | 'sm' | 'md' | 'lg'
 *   color   – optional override color
 *   showName – show name label beside avatar
 *   className – extra wrapper classes
 */
export default function UserAvatar({
  name = '',
  avatar,
  size = 'sm',
  color,
  showName = false,
  className = '',
}) {
  const sizes = {
    xs: 'w-5 h-5 text-[8px]',
    sm: 'w-7 h-7 text-[10px]',
    md: 'w-9 h-9 text-[12px]',
    lg: 'w-11 h-11 text-[14px]',
  };

  const bg = color ?? getAvatarColor(name);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className={`${sizes[size]} rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0 ring-1 ring-black/20`}
        style={avatar ? {} : { background: bg }}
        title={name}
      >
        {avatar ? (
          <img
            src={avatar}
            alt={name}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          getInitials(name)
        )}
      </div>
      {showName && name && (
        <span className="text-[13px] text-[#ccc] truncate">{name}</span>
      )}
    </div>
  );
}s