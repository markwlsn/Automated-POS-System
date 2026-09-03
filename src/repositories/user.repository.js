import { getDatabase } from '../db/index.js'

export class UserRepository {
  constructor(db = getDatabase()) {
    this.db = db
  }

  findByEmail(email) {
    const stmt = this.db.prepare(`
      SELECT id, email, password_hash as passwordHash, role, branch_id as branchId, full_name as fullName, phone_number as phoneNumber, created_at as createdAt
      FROM profiles
      WHERE lower(email) = lower(?)
    `)
    return stmt.get(email) || null
  }

  findById(id) {
    const stmt = this.db.prepare(`
      SELECT id, email, role, branch_id as branchId, full_name as fullName, phone_number as phoneNumber, created_at as createdAt
      FROM profiles
      WHERE id = ?
    `)
    return stmt.get(id) || null
  }

  create({ id, email, passwordHash, role = 'customer', branchId = null, fullName, phoneNumber = null }) {
    const stmt = this.db.prepare(`
      INSERT INTO profiles (id, email, password_hash, role, branch_id, full_name, phone_number)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    stmt.run(id, email, passwordHash, role, branchId, fullName, phoneNumber)
    return this.findById(id)
  }
}
