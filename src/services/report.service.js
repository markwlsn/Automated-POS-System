import { ReportRepository } from '../repositories/report.repository.js'
import { env } from '../config/env.js'

export class ReportService {
  constructor(reportRepo = new ReportRepository()) {
    this.reportRepo = reportRepo
  }

  getSummary({ shopId = env.DEFAULT_SHOP_ID, branchId = null, startDate = null, endDate = null }) {
    return this.reportRepo.getSummary({ shopId, branchId, startDate, endDate })
  }
}
