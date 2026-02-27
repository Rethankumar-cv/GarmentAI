import os
import shutil
import pandas as pd
from ml_monitoring.data_drift import run_drift_check
from ml_monitoring.alert_manager import alert_manager

# 1. Clear old baseline
print('Clearing baseline...')
if os.path.exists('monitoring/snapshots/analytics_snapshot.json'):
    os.remove('monitoring/snapshots/analytics_snapshot.json')

# 2. Baseline creation (using clean data)
print('Generating baseline...')
res = run_drift_check()
print(f'Baseline created: {res}')

# 3. Simulate drift
print('Simulating drift...')
df = pd.read_csv('analytics/pricing_signals.csv')
original_df = df.copy()
df['avg_price'] = df['avg_price'] * 10
df.to_csv('analytics/pricing_signals.csv', index=False)

# 4. Check for drift
print('Detecting drift...')
res2 = run_drift_check()
print(f'Drift check result: {res2}')
if res2.get('drift_detected'):
    alert_manager.data_drift(res2['drift_score'], top_features=res2.get('top_drifting_features'))
    print('Alert emitted!')

# 5. Restore clean data
print('Restoring original data...')
original_df.to_csv('analytics/pricing_signals.csv', index=False)
res3 = run_drift_check()
print(f'Final check (should be false): {res3}')
