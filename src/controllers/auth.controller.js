import { AuthService } from '../services/auth.service.js'

const authService = new AuthService()

export async function signUp(req, res, next) {
  try {
    const { email, password, fullName, phoneNumber } = req.body
    const result = await authService.signUp({ email, password, fullName, phoneNumber })
    return res.status(201).json({ data: result })
  } catch (err) {
    next(err)
  }
}

export async function signIn(req, res, next) {
  try {
    const { email, password } = req.body
    const result = await authService.signIn({ email, password })
    return res.success(result)
  } catch (err) {
    next(err)
  }
}

export function getMe(req, res, next) {
  try {
    const profile = authService.getProfile(req.user.id)
    return res.success({ user: profile })
  } catch (err) {
    next(err)
  }
}
