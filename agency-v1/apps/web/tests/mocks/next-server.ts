export class NextRequest {}
export class NextResponse {
  static json(body: any, init?: any) {
    return {
      status: init?.status ?? 200,
      json: async () => body,
      ...init
    };
  }
}
