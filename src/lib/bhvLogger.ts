/**
 * BHV Logger - Dedicated logging for BHV online requests
 * Core feature tracking with complete audit trail
 */

import { Types } from 'mongoose';

interface BhvLogData {
  contractId: string;
  contractNumber?: string;
  requestPayload: {
    action_name: string;
    data: string;
    d_info: Record<string, any>;
  };
  cookies?: any;
  userId?: string;
  userIp?: string;
}

interface BhvResponseData {
  success: boolean;
  responseData?: any;
  responseStatus?: number;
  bhvStatusCode?: number;
  pdfReceived?: boolean;
  pdfSize?: number;
  duration: number;
}

interface BhvErrorData {
  errorMessage: string;
  errorDetails?: string;
  responseData?: any;
  duration: number;
}

class BhvLogger {
  /**
   * Log BHV request before sending
   */
  async logRequest(data: BhvLogData): Promise<string | null> {
    try {
      const BhvRequestLog = (await import('@/models/BhvRequestLog')).default;

      const requestSize = JSON.stringify(data.requestPayload).length;
      const cookieKeys = data.cookies ? Object.keys(data.cookies) : [];

      const log = await BhvRequestLog.create({
        timestamp: new Date(),
        contractId: new Types.ObjectId(data.contractId),
        contractNumber: data.contractNumber || 'Unknown',
        requestPayload: data.requestPayload,
        requestSize,
        cookieKeys,
        hasCookies: cookieKeys.length > 0,
        success: false, // Will update on response
        duration: 0, // Will update on response
        bhvEndpoint: 'https://my.bhv.com.vn',
        pdfReceived: false,
        userId: data.userId ? new Types.ObjectId(data.userId) : undefined,
        userIp: data.userIp,
        isRetry: false,
        retryCount: 0,
      });

      return log._id.toString();
    } catch (error) {
      console.error('Failed to log BHV request:', error);
      return null;
    }
  }

  /**
   * Update log with success response
   */
  async logResponse(logId: string, data: BhvResponseData) {
    try {
      const BhvRequestLog = (await import('@/models/BhvRequestLog')).default;

      const responseSize = data.responseData ? JSON.stringify(data.responseData).length : 0;

      await BhvRequestLog.findByIdAndUpdate(logId, {
        success: data.success,
        responseStatus: data.responseStatus,
        responseData: data.responseData,
        responseSize,
        bhvStatusCode: data.bhvStatusCode,
        pdfReceived: data.pdfReceived || false,
        pdfSize: data.pdfSize,
        duration: data.duration,
      });
    } catch (error) {
      console.error('Failed to log BHV response:', error);
    }
  }

  /**
   * Update log with error
   */
  async logError(logId: string, data: BhvErrorData) {
    try {
      const BhvRequestLog = (await import('@/models/BhvRequestLog')).default;

      const responseSize = data.responseData ? JSON.stringify(data.responseData).length : 0;

      await BhvRequestLog.findByIdAndUpdate(logId, {
        success: false,
        errorMessage: data.errorMessage,
        errorDetails: data.errorDetails,
        responseData: data.responseData,
        responseSize,
        duration: data.duration,
      });
    } catch (error) {
      console.error('Failed to log BHV error:', error);
    }
  }

  /**
   * Log complete request-response cycle in one call (fallback)
   */
  async logComplete(data: BhvLogData & BhvResponseData & Partial<BhvErrorData>) {
    try {
      const BhvRequestLog = (await import('@/models/BhvRequestLog')).default;

      const requestSize = JSON.stringify(data.requestPayload).length;
      const responseSize = data.responseData ? JSON.stringify(data.responseData).length : 0;
      const cookieKeys = data.cookies ? Object.keys(data.cookies) : [];

      await BhvRequestLog.create({
        timestamp: new Date(),
        contractId: new Types.ObjectId(data.contractId),
        contractNumber: data.contractNumber || 'Unknown',
        requestPayload: data.requestPayload,
        requestSize,
        cookieKeys,
        hasCookies: cookieKeys.length > 0,
        success: data.success,
        responseStatus: data.responseStatus,
        responseData: data.responseData,
        responseSize,
        bhvStatusCode: data.bhvStatusCode,
        pdfReceived: data.pdfReceived || false,
        pdfSize: data.pdfSize,
        errorMessage: data.errorMessage,
        errorDetails: data.errorDetails,
        duration: data.duration,
        bhvEndpoint: 'https://my.bhv.com.vn',
        userId: data.userId ? new Types.ObjectId(data.userId) : undefined,
        userIp: data.userIp,
        isRetry: false,
        retryCount: 0,
      });
    } catch (error) {
      console.error('Failed to log complete BHV request:', error);
    }
  }

  /**
   * Get BHV request statistics
   */
  async getStats(hours = 24) {
    try {
      const BhvRequestLog = (await import('@/models/BhvRequestLog')).default;

      const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000);

      const [total, successful, failed, avgDuration] = await Promise.all([
        BhvRequestLog.countDocuments({ timestamp: { $gte: cutoffDate } }),
        BhvRequestLog.countDocuments({ timestamp: { $gte: cutoffDate }, success: true }),
        BhvRequestLog.countDocuments({ timestamp: { $gte: cutoffDate }, success: false }),
        BhvRequestLog.aggregate([
          { $match: { timestamp: { $gte: cutoffDate } } },
          { $group: { _id: null, avgDuration: { $avg: '$duration' } } },
        ]),
      ]);

      return {
        total,
        successful,
        failed,
        successRate: total > 0 ? ((successful / total) * 100).toFixed(2) : '0',
        avgDuration: avgDuration[0]?.avgDuration?.toFixed(0) || 0,
      };
    } catch (error) {
      console.error('Failed to get BHV stats:', error);
      return null;
    }
  }
}

export const bhvLogger = new BhvLogger();
export default bhvLogger;
