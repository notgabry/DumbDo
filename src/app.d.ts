declare global {
  namespace App {
    interface Locals {
      user: {
        authenticated: boolean
      }
    }
  }
}

export {}
