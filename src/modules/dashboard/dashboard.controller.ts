import { Request, Response } from 'express';
import * as dashboardService from './dashboard.service';
import { sendSuccess } from '../../utils/response';

export async function getSummary(req: Request, res: Response): Promise<void> {
  const data = await dashboardService.getSummary();
  sendSuccess(res, data);
}

export async function getCategoryBreakdown(req: Request, res: Response): Promise<void> {
  const data = await dashboardService.getCategoryBreakdown();
  sendSuccess(res, data);
}

export async function getMonthlyTrends(req: Request, res: Response): Promise<void> {
  const data = await dashboardService.getMonthlyTrends();
  sendSuccess(res, data);
}

export async function getRecentActivity(req: Request, res: Response): Promise<void> {
  const data = await dashboardService.getRecentActivity();
  sendSuccess(res, data);
}
