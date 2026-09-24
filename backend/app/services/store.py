from collections import defaultdict, deque
import math
import threading
import numpy as np


def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
  r = 6371.0
  p1, p2 = math.radians(lat1), math.radians(lat2)
  dphi, dl = p2 - p1, math.radians(lon2 - lon1)
  a = (
      math.sin(dphi / 2) ** 2
      + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
  )
  return 2 * r * math.asin(math.sqrt(a))


class FeatureStore:

  def __init__(self):
    self.hist = defaultdict(lambda: deque(maxlen=500))
    self.devices = defaultdict(set)
    self.device_accts = defaultdict(set)
    self.ben = defaultdict(lambda: deque(maxlen=200))
    self.lock = threading.Lock()

  def compute(self, t) -> dict:
    now = t.timestamp.timestamp()
    with self.lock:
      h = list(self.hist[t.account_id])
      known = set(self.devices[t.account_id])
      dev_accts = set(self.device_accts[t.device_id]) | {t.account_id}
      ben_accts = {
          a for ts, a in self.ben[t.beneficiary_id] if now - ts <= 600
      } | {t.account_id}

    r1 = [x for x in h if now - x[0] <= 60]
    r10 = [x for x in h if now - x[0] <= 600]
    amts = [x[2] for x in h]

    km = speed = 0.0
    if h:
      last = h[-1]
      km = haversine(last[4], last[5], t.lat, t.lon)
      hrs = max(now - last[0], 1) / 3600.0
      speed = km / hrs

    return {
        "cnt_1m": len(r1) + 1,
        "cnt_10m": len(r10) + 1,
        "channels_10m": len({x[1] for x in r10} | {t.channel}),
        "sum_1h": sum(x[2] for x in h if now - x[0] <= 3600) + t.amount,
        "history": len(h),
        "amount_ratio": (
            t.amount / (float(np.mean(amts)) + 1) if len(amts) >= 3 else 1.0
        ),
        "new_device": bool(known) and t.device_id not in known,
        "accounts_per_device": len(dev_accts),
        "accounts_per_beneficiary": len(ben_accts),
        "km_since_last": km,
        "speed_kmh": speed,
    }

  def update(self, t):
    with self.lock:
      self.hist[t.account_id].append((
          t.timestamp.timestamp(),
          t.channel,
          t.amount,
          t.device_id,
          t.lat,
          t.lon,
      ))
      self.devices[t.account_id].add(t.device_id)
      self.device_accts[t.device_id].add(t.account_id)
      self.ben[t.beneficiary_id].append((t.timestamp.timestamp(), t.account_id))