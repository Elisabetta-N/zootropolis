-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Vehicle" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
    "lat" REAL NOT NULL,
    "lng" REAL NOT NULL,
    "batteryLevel" INTEGER NOT NULL DEFAULT 100,
    "status" TEXT NOT NULL DEFAULT 'available',
    "hasFault" BOOLEAN NOT NULL DEFAULT false,
    "faultNote" TEXT,
    "blocked" BOOLEAN NOT NULL DEFAULT false,
    "stolen" BOOLEAN NOT NULL DEFAULT false,
    "stolenAt" DATETIME
);
INSERT INTO "new_Vehicle" ("batteryLevel", "blocked", "faultNote", "hasFault", "id", "lat", "lng", "status", "type") SELECT "batteryLevel", "blocked", "faultNote", "hasFault", "id", "lat", "lng", "status", "type" FROM "Vehicle";
DROP TABLE "Vehicle";
ALTER TABLE "new_Vehicle" RENAME TO "Vehicle";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
