export type HasProperties<T, Base = {}> = Partial<Record<keyof Omit<T, keyof Base>, any>>
