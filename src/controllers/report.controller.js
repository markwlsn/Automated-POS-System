import { ReportService } from '../services/report.service.js'

const reportService = new ReportService()

export function getSummary(req, res, next) {
  try {
    const { branchId, startDate, endDate } = req.query
    const summary = reportService.getSummary({
      branchId,
      startDate,
      endDate,
    })
    return res.success(summary)
  } catch (err) {
    next(err)
  }
}
