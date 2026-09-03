import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'node:crypto'
import { UserRepository } from '../repositories/user.repository.js'
import { env } from '../config/env.js'

export class AuthService {
  constructor(userRepo = new UserRepository()) {
    this.userRepo = userRepo
  }

  async signUp({ email, password, fullName, phoneNumber = null, role = 'customer', branchId = null }) {
    const existing = this.userRepo.findByEmail(email)
    if (existing) {
      const err = new Error('Email is already registered')
      err.code = 'CONFLICT'
      err.status = 409
      throw err
    }

    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(password, salt)
    const id = crypto.randomUUID()

    const user = this.userRepo.create({
      id,
      email,
      passwordHash,
      role,
      branchId,
      fullName,
      phoneNumber,
    })

    const token = this.generateToken(user)
    return { user, token }
  }

  async signIn({ email, password }) {
    const userWithHash = this.userRepo.findByEmail(email)
    if (!userWithHash) {
      const err = new Error('Invalid email or password')
      err.code = 'UNAUTHORIZED'
      err.status = 401
      throw err
    }

    const isMatch = await bcrypt.compare(password, userWithHash.passwordHash)
    if (!isMatch) {
      const err = new Error('Invalid email or password')
      err.code = 'UNAUTHORIZED'
      err.status = 401
      throw err
    }

    const user = {
      id: userWithHash.id,
      email: userWithHash.email,
      role: userWithHash.role,
      branchId: userWithHash.branchId,
      fullName: userWithHash.fullName,
      phoneNumber: userWithHash.phoneNumber,
    }

    const token = this.generateToken(user)
    return { user, token }
  }

  getProfile(userId) {
    const user = this.userRepo.findById(userId)
    if (!user) {
      const err = new Error('User not found')
      err.code = 'RESOURCE_NOT_FOUND'
      err.status = 404
      throw err
    }
    return user
  }

  generateToken(user) {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        branchId: user.branchId,
      },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    )
  }
}
