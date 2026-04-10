type Callback = (value: string) => void
let _cb: Callback | null = null

export const pickerCallback = {
  register: (cb: Callback) => { _cb = cb },
  call: (value: string) => { _cb?.(value); _cb = null },
}
