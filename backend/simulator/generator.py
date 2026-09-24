import asyncio
from datetime import datetime, timedelta, timezone
import random
import uuid

from app.schemas import TxnIn


CITIES = {
    "BLR": (12.97, 77.59),
    "DEL": (28.61, 77.21),
    "MUM": (19.07, 72.88),
    "HYD": (17.38, 78.48),
}


class Sim:

    def __init__(self, process, n_accounts: int = 200):
        self.process = process
        self.running = False
        self.acc = {}

        for i in range(n_accounts):
            self.acc[f"A{i:04d}"] = {
                "balance": random.uniform(20_000, 500_000),
                "device": f"D{i:04d}",
                "city": random.choice(list(CITIES)),
                "home": random.choice(
                    ["UPI", "CARD", "NETBANKING"]
                ),
                "ip": (
                    f"103.21.{random.randint(0, 255)}."
                    f"{random.randint(1, 254)}"
                ),
            }

        self.scenarios = {
            "ato": self.ato,
            "velocity": self.velocity,
            "cross_channel": self.cross_channel,
            "travel": self.travel,
            "mule_ring": self.mule_ring,
        }

    def _geo(self, city):
        la, lo = CITIES[city]

        return (
            la + random.uniform(-0.02, 0.02),
            lo + random.uniform(-0.02, 0.02),
        )

    def make(
        self,
        acc_id,
        *,
        channel=None,
        txn_type=None,
        amount=None,
        device=None,
        city=None,
        ben=None,
        fraud=False,
        ts=None,
    ) -> TxnIn:

        a = self.acc[acc_id]

        channel = channel or a["home"]

        txn_type = txn_type or (
            "TRANSFER"
            if channel == "NETBANKING"
            else "PAYMENT"
        )

        old = a["balance"]

        amount = round(
            old
            if fraud
            else min(
                amount or random.lognormvariate(7.5, 0.7),
                old * 0.5,
            ),
            2,
        )

        new = round(old - amount, 2)

        a["balance"] = (
            random.uniform(20_000, 500_000)
            if fraud
            else new
        )

        if txn_type == "PAYMENT" or fraud:
            od, nd = 0.0, 0.0
        else:
            od = random.uniform(10_000, 1_000_000)
            nd = od + amount

        lat, lon = self._geo(city or a["city"])

        extra = {"timestamp": ts} if ts else {}

        return TxnIn(
            account_id=acc_id,
            channel=channel,
            txn_type=txn_type,
            amount=amount,
            old_balance_orig=old,
            new_balance_orig=new,
            old_balance_dest=od,
            new_balance_dest=nd,
            beneficiary_id=(
                ben or f"B{random.randint(0, 1999):04d}"
            ),
            device_id=device or a["device"],
            ip=a["ip"],
            lat=lat,
            lon=lon,
            **extra,
        )

    def warm_up(self, store):
        now = datetime.now(timezone.utc)

        for k in range(5, 0, -1):
            for acc_id in self.acc:
                store.update(
                    self.make(
                        acc_id,
                        ts=now - timedelta(hours=k),
                    )
                )

    async def ato(self):
        acc = random.choice(list(self.acc))

        await self.process(
            self.make(
                acc,
                txn_type="TRANSFER",
                channel="NETBANKING",
                fraud=True,
                device=f"NEW-{uuid.uuid4().hex[:6]}",
                ben=f"MULE-{uuid.uuid4().hex[:4]}",
            )
        )

    async def velocity(self):
        acc = random.choice(list(self.acc))
        ben = f"M{uuid.uuid4().hex[:4]}"

        for _ in range(8):
            await self.process(
                self.make(
                    acc,
                    channel="UPI",
                    txn_type="PAYMENT",
                    amount=random.uniform(100, 400),
                    ben=ben,
                )
            )

            await asyncio.sleep(0.2)

    async def cross_channel(self):
        acc = random.choice(list(self.acc))

        for ch, ty in [
            ("CARD", "PAYMENT"),
            ("UPI", "TRANSFER"),
            ("ATM", "CASH_OUT"),
        ]:
            await self.process(
                self.make(
                    acc,
                    channel=ch,
                    txn_type=ty,
                    amount=random.uniform(3_000, 9_000),
                )
            )

            await asyncio.sleep(0.5)

    async def travel(self):
        acc = random.choice(list(self.acc))

        home = self.acc[acc]["city"]

        far = random.choice(
            [c for c in CITIES if c != home]
        )

        await self.process(self.make(acc))

        await asyncio.sleep(0.4)

        await self.process(
            self.make(
                acc,
                city=far,
                amount=random.uniform(4_000, 12_000),
            )
        )

    async def mule_ring(self):
        ben = f"RING-{uuid.uuid4().hex[:4]}"

        for acc in random.sample(list(self.acc), 6):
            await self.process(
                self.make(
                    acc,
                    channel="UPI",
                    txn_type="TRANSFER",
                    amount=random.uniform(5_000, 15_000),
                    ben=ben,
                )
            )

            await asyncio.sleep(0.3)

    async def run(self, rate=3.0, fraud_rate=0.05):
        self.running = True

        while self.running:
            if random.random() < fraud_rate:
                asyncio.create_task(
                    random.choice(
                        list(self.scenarios.values())
                    )()
                )
            else:
                await self.process(
                    self.make(
                        random.choice(list(self.acc))
                    )
                )

            await asyncio.sleep(1.0 / rate)