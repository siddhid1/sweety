-- Add CHECK constraint: glucose value must be between 40 and 600 mg/dl.
ALTER TABLE "readings" DROP CONSTRAINT IF EXISTS "readings_value_check";
ALTER TABLE "readings" ADD CONSTRAINT "readings_value_check" CHECK ("value" >= 40 AND "value" <= 600);
