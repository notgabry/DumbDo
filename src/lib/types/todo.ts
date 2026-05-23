export interface Todo {
  text: string
  completed: boolean
  _id?: number
}

export interface TodosData {
  [listName: string]: Todo[]
}

export interface PinStatus {
  required: boolean
  length: number
  locked: boolean
  attemptsLeft: number
  lockoutMinutes: number
}

export interface PinVerifyResponse {
  valid: boolean
  error?: string
  locked?: boolean
  lockoutMinutes?: number
  attemptsLeft?: number
}

export interface SiteConfig {
  siteTitle: string
  singleList: boolean
}
