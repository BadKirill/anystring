export interface OverflowScroller {
  style: { overflowX: string }
  readonly offsetWidth: number
}

export function reviveOverflowScroll(el: OverflowScroller): void {
  el.style.overflowX = 'hidden'
  void el.offsetWidth
  el.style.overflowX = ''
}
