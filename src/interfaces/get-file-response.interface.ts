export interface GetFileResponse {
  result: Result;
}

interface Result {
  file_id: string;
  file_unique_id: string;
  file_size: number;
  file_path: string;
}
