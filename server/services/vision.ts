import { storage } from "../storage";
import { logger } from "../logger";

export interface VisionFinding {
  part: string;
  type: string; // scratch, dent, crack
  severity: "low" | "medium" | "high";
  confidence: number;
}

export async function processInspection(
  inspectionId: string,
  userId: string,
  mediaUrls: string[],
): Promise<VisionFinding[]> {
  try {
    // Mock AI processing delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Mock vision logic: if "damage" is in the URL, simulate a finding
    const findings: VisionFinding[] = [];

    if (mediaUrls.some((url) => url.toLowerCase().includes("damage"))) {
      findings.push({
        part: "Rear Bumper",
        type: "scratch",
        severity: "low",
        confidence: 0.94,
      });
    }

    // Update storage with findings
    const inspection = await storage.getInspection(inspectionId, userId);
    if (inspection) {
      await storage.updateInspection(inspectionId, userId, {
        aiFindings: findings,
        status: "completed",
      });

      // If severe damage found, update vehicle status
      if (findings.some((f) => f.severity === "high")) {
        await storage.updateVehicle(inspection.vehicleId, userId, {
          status: "maintenance",
          lastKnownCondition: "AI detected severe damage",
        });
      } else if (findings.length > 0) {
        await storage.updateVehicle(inspection.vehicleId, userId, {
          lastKnownCondition: `AI detected ${findings.length} minor issue(s)`,
        });
      } else {
        await storage.updateVehicle(inspection.vehicleId, userId, {
          lastKnownCondition: "AI verified clean condition",
        });
      }
    }

    return findings;
  } catch (err) {
    // On failure, mark inspection as failed so it doesn't stay "processing" forever
    logger.error({ err, inspectionId }, "Vision processing failed");
    try {
      await storage.updateInspection(inspectionId, userId, {
        status: "failed",
        aiFindings: [{ error: err instanceof Error ? err.message : String(err) }],
      });
    } catch (updateErr) {
      logger.error({ err: updateErr, inspectionId }, "Failed to mark inspection as failed");
    }
    throw err;
  }
}
