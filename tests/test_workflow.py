"""Exercise the original FYP workflow using a temporary database and uploads."""
import io
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'backend'))
import database
import app as server
from modules import categoriser


class OrderWorkflow(unittest.TestCase):
    def test_import_analyse_export(self):
        with tempfile.TemporaryDirectory() as folder:
            original = (database.DB_PATH, categoriser.DB_PATH, server.UPLOAD_DIR)
            database.DB_PATH = str(Path(folder) / 'test.db')
            categoriser.DB_PATH = database.DB_PATH
            server.UPLOAD_DIR = folder
            try:
                database.init_db()
                client = server.app.test_client()
                self.assertEqual(client.get('/api/analytics').status_code, 401)
                login = client.post('/api/auth/login', json={'email':'admin@opa.com','password':'admin123'})
                self.assertEqual(login.status_code, 200)
                headers = {'Authorization': 'Bearer ' + login.json['token']}
                data = (ROOT / 'sample_orders_2026.csv').read_bytes()
                upload = client.post('/api/upload', headers=headers,
                    data={'file': (io.BytesIO(data), 'synthetic-orders.csv')})
                self.assertEqual(upload.status_code, 200, upload.json)
                processed = client.post(f"/api/process/{upload.json['file_id']}", headers=headers)
                self.assertEqual(processed.status_code, 200, processed.json)
                analytics = client.get('/api/analytics', headers=headers)
                self.assertEqual(analytics.status_code, 200)
                self.assertGreater(analytics.json['kpi']['total_orders'], 0)
                for endpoint in ['anomalies','insights','recommendations','inventory','categories']:
                    self.assertEqual(client.get('/api/' + endpoint, headers=headers).status_code, 200, endpoint)
                csv = client.get('/api/export/csv', headers=headers)
                self.assertEqual(csv.status_code, 200)
                self.assertIn(b'product_name', csv.data)
                pdf = client.get('/api/export/pdf', headers=headers)
                self.assertEqual(pdf.status_code, 200)
                self.assertTrue(pdf.data.startswith(b'%PDF'))
            finally:
                database.DB_PATH, categoriser.DB_PATH, server.UPLOAD_DIR = original
                server.SESSIONS.clear()


if __name__ == '__main__':
    unittest.main()
