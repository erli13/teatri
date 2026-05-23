import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  const venue = await prisma.venue.create({
    data: {
      name: "Teatri Elbasan",
      address: "Rruga Qemal Stafa",
      city: "Elbasan",
    },
  });
  console.log(`Created venue: ${venue.name}`);

  const mainFloor = await prisma.seatingZone.create({
    data: {
      name: "Main Floor",
      description: "Ground level seating",
      venueId: venue.id,
    },
  });

  const balcony = await prisma.seatingZone.create({
    data: {
      name: "Balcony",
      description: "Upper level seating",
      venueId: venue.id,
    },
  });
  console.log(`Created zones: ${mainFloor.name}, ${balcony.name}`);

  const mainFloorRows = ["A", "B", "C", "D", "E"];
  const balconyRows = ["F", "G"];
  const seatsPerRow = 10;

  const mainFloorSeats = mainFloorRows.flatMap((row) =>
    Array.from({ length: seatsPerRow }, (_, i) => ({
      rowLabel: row,
      seatNumber: i + 1,
      zoneId: mainFloor.id,
    }))
  );

  const balconySeats = balconyRows.flatMap((row) =>
    Array.from({ length: seatsPerRow }, (_, i) => ({
      rowLabel: row,
      seatNumber: i + 1,
      zoneId: balcony.id,
    }))
  );

  await prisma.seat.createMany({ data: [...mainFloorSeats, ...balconySeats] });
  console.log(
    `Created ${mainFloorSeats.length} main floor seats and ${balconySeats.length} balcony seats`
  );

  const now = new Date();
  const inOneWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const inTwoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  const show1 = await prisma.show.create({
    data: {
      title: "Matrix 4",
      description: "Neo returns to the Matrix.",
      startsAt: inOneWeek,
      endsAt: new Date(inOneWeek.getTime() + 2.5 * 60 * 60 * 1000),
      venueId: venue.id,
    },
  });

  const show2 = await prisma.show.create({
    data: {
      title: "Dragon Ball Super: Super Hero",
      description: "Goku and Vegeta face a new threat.",
      startsAt: inTwoWeeks,
      endsAt: new Date(inTwoWeeks.getTime() + 2 * 60 * 60 * 1000),
      venueId: venue.id,
    },
  });
  console.log(`Created shows: ${show1.title}, ${show2.title}`);

  await prisma.showPrice.createMany({
    data: [
      { showId: show1.id, zoneId: mainFloor.id, price: 500, currency: "ALL" },
      { showId: show1.id, zoneId: balcony.id, price: 300, currency: "ALL" },
      { showId: show2.id, zoneId: mainFloor.id, price: 500, currency: "ALL" },
      { showId: show2.id, zoneId: balcony.id, price: 300, currency: "ALL" },
    ],
  });
  console.log("Created show prices");

  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
