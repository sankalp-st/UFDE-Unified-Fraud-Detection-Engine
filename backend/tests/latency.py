import asyncio
import statistics
import time
import httpx
from tests.test_api import LEGIT


async def one(client):
  t = time.perf_counter()
  await client.post("/api/v1/score", json=LEGIT)
  return (time.perf_counter() - t) * 1000


async def main():
  async with httpx.AsyncClient(
      base_url="http://localhost:8000", timeout=30
  ) as client:
    # warm up
    await client.post("/api/v1/score", json=LEGIT)
    lat = sorted(await asyncio.gather(*[one(client) for _ in range(500)]))
  print(
      f"p50={statistics.median(lat):.1f}ms "
      f"p95={lat[int(0.95 * len(lat))]:.1f}ms "
      f"p99={lat[int(0.99 * len(lat))]:.1f}ms"
  )


if __name__ == "__main__":
  asyncio.run(main())