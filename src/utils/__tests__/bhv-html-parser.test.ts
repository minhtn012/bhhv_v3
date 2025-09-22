/**
 * Tests for BHV HTML Parser
 */

import { parseBhvHtmlResponse, validatePremiumData } from '../bhv-html-parser';

describe('BHV HTML Parser', () => {
  const sampleHtmlResponse = `
<div class="p-2">
    <h3 class="fw-bold mb-5 mt-2 pt-1">THÔNG TIN PHÍ</h3>
    <div class="d-flex justify-content-between">
        <h6 class="text-danger">Đơn vị tính</h6>
        <h6 class="text-danger">VNĐ</h6>
    </div>
    <hr class="my-4">
    <input type="hidden" id="hdf_total_premium" name="total_premium" value="17901600"/>
    <h5 class="fw-bold mb-4">PHÍ TỪNG LOẠI BẢO HIỂM:</h5>
            <div class="row">
                <div class="col-md-12 mb-2"><h6>1. Bảo hiểm Vật chất xe ôtô</h6></div>
                <div class="col-md-12 mb-2 text-right d-flex justify-content-between"><h6>Phí bảo hiểm:</h6> <h6>13.309.090</h6></div>
                <div class="col-md-12 text-right d-flex justify-content-between"><h6>Thuế:</h6> <h6>1.330.910</h6></div>
            </div>
            <hr class="my-4">
            <div class="row">
                <div class="col-md-12 mb-2"><h6>2. Bảo hiểm TNDS bắt buộc của chủ xe ôtô</h6></div>
                <div class="col-md-12 mb-2 text-right d-flex justify-content-between"><h6>Phí bảo hiểm:</h6> <h6>756.000</h6></div>
                <div class="col-md-12 text-right d-flex justify-content-between"><h6>Thuế:</h6> <h6>75.600</h6></div>
            </div>
            <hr class="my-4">
            <div class="row">
                <div class="col-md-12 mb-2"><h6>3. Bảo hiểm trách nhiệm bồi thường đối với lái phụ xe và người ngồi trên xe oto</h6></div>
                <div class="col-md-12 mb-2 text-right d-flex justify-content-between"><h6>Phí bảo hiểm:</h6> <h6>27.273</h6></div>
                <div class="col-md-12 text-right d-flex justify-content-between"><h6>Thuế:</h6> <h6>2.727</h6></div>
            </div>
            <hr class="my-4">
            <div class="row">
                <div class="col-md-12 mb-2"><h6>4. Bảo hiểm lựa chọn cơ sở sửa chữa</h6></div>
                <div class="col-md-12 mb-2 text-right d-flex justify-content-between"><h6>Phí bảo hiểm:</h6> <h6>727.273</h6></div>
                <div class="col-md-12 text-right d-flex justify-content-between"><h6>Thuế:</h6> <h6>72.727</h6></div>
            </div>
            <hr class="my-4">
            <div class="row">
                <div class="col-md-12 mb-2"><h6>5. Bảo hiểm tổn thất của động cơ khi xe hoạt động trong khu vực bị ngập nước</h6></div>
                <div class="col-md-12 mb-2 text-right d-flex justify-content-between"><h6>Phí bảo hiểm:</h6> <h6>727.273</h6></div>
                <div class="col-md-12 text-right d-flex justify-content-between"><h6>Thuế:</h6> <h6>72.727</h6></div>
            </div>
            <hr class="my-4">
            <div class="row">
                <div class="col-md-12 mb-2"><h6>6. Bảo hiểm thay thế mới/ Bảo hiểm mới thay cũ</h6></div>
                <div class="col-md-12 mb-2 text-right d-flex justify-content-between"><h6>Phí bảo hiểm:</h6> <h6>727.273</h6></div>
                <div class="col-md-12 text-right d-flex justify-content-between"><h6>Thuế:</h6> <h6>72.727</h6></div>
            </div>
            <hr class="my-4">
    <div class="d-flex justify-content-between mb-4">
        <h6>Tổng phí bảo hiểm</h6>
        <h6>16.274.182</h6>
    </div>

    <div class="d-flex justify-content-between mb-4">
        <h6>Tổng thuế</h6>
        <h6>1.627.418</h6>
    </div>
    <hr class="my-4">
    <div class="d-flex justify-content-between">
        <h5>Tổng phí</h5>
        <h5>
            <span id="total_payment_row" class="text-danger">
                17.901.600
            </span>
        </h5>
    </div>
</div>`;

  test('should parse BHV HTML response correctly', () => {
    const result = parseBhvHtmlResponse(sampleHtmlResponse);

    expect(result).toEqual({
      bhvc: {
        beforeTax: expect.any(Number),
        afterTax: expect.any(Number)
      },
      tnds: {
        beforeTax: 756000,
        afterTax: 831600 // 756000 + 75600
      },
      nntx: {
        beforeTax: 27273,
        afterTax: 30000  // 27273 + 2727
      },
      totalPremium: {
        beforeTax: expect.any(Number),
        afterTax: 17901600
      }
    });

    // BHVC should be total minus TNDS and NNTX
    const expectedBhvc = 17901600 - 831600 - 30000;
    expect(result.bhvc.afterTax).toBe(expectedBhvc);
  });

  test('should handle total premium from hidden input', () => {
    const result = parseBhvHtmlResponse(sampleHtmlResponse);
    expect(result.totalPremium.afterTax).toBe(17901600);
  });

  test('should identify TNDS package correctly', () => {
    const result = parseBhvHtmlResponse(sampleHtmlResponse);
    expect(result.tnds.afterTax).toBe(831600); // 756000 + 75600
  });

  test('should identify NNTX package correctly', () => {
    const result = parseBhvHtmlResponse(sampleHtmlResponse);
    expect(result.nntx.afterTax).toBe(30000); // 27273 + 2727
  });

  test('should return zero values for empty HTML', () => {
    const result = parseBhvHtmlResponse('');
    expect(result).toEqual({
      bhvc: { beforeTax: 0, afterTax: 0 },
      tnds: { beforeTax: 0, afterTax: 0 },
      nntx: { beforeTax: 0, afterTax: 0 },
      totalPremium: { beforeTax: 0, afterTax: 0 }
    });
  });

  test('validatePremiumData should validate consistent data', () => {
    const validData = {
      bhvc: { beforeTax: 15490909, afterTax: 17040000 },
      tnds: { beforeTax: 756000, afterTax: 831600 },
      nntx: { beforeTax: 27273, afterTax: 30000 },
      totalPremium: { beforeTax: 16274182, afterTax: 17901600 }
    };

    expect(validatePremiumData(validData)).toBe(true);
  });

  test('validatePremiumData should reject inconsistent data', () => {
    const invalidData = {
      bhvc: { beforeTax: 9090909, afterTax: 10000000 },
      tnds: { beforeTax: 909091, afterTax: 1000000 },
      nntx: { beforeTax: 909091, afterTax: 1000000 },
      totalPremium: { beforeTax: 4545455, afterTax: 5000000 }  // Much lower than sum
    };

    expect(validatePremiumData(invalidData)).toBe(false);
  });
});