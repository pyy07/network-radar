export function EmptyState({ message = '暂无快照数据' }: { message?: string }) {
  return <div className="empty-state">{message}</div>
}
