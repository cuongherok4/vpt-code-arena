type OnlineIndicatorProps = {
  online: boolean;
};

export const OnlineIndicator = ({ online }: OnlineIndicatorProps) => (
  <span
    className={`h-2.5 w-2.5 rounded-full ${online ? 'bg-emerald-400 shadow-[0_0_0_3px_rgba(52,211,153,0.14)]' : 'bg-slate-600'}`}
    aria-label={online ? 'Online' : 'Offline'}
    title={online ? 'Online' : 'Offline'}
  />
);
