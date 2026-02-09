export interface TinyUrlResponse {
  data: Data;
  code: number;
  errors: any[];
}

interface Data {
  domain: string;
  alias: string;
  deleted: boolean;
  archived: boolean;
  analytics: Analytics;
  tags: any[];
  created_at: string;
  expires_at: any;
  tiny_url: string;
  url: string;
}

interface Analytics {
  enabled: boolean;
  public: boolean;
}
