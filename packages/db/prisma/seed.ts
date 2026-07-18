import {
  PrismaClient,
  PatientType,
  RiskTier,
  ReferralStatus,
  PatientSex,
  AgeUnit,
  MaternalStatus,
  CaseStatus,
} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.timelineEvent.deleteMany();
  await prisma.checklistResponse.deleteMany();
  await prisma.referral.deleteMany();
  await prisma.case.deleteMany();

  const chwId = "chw-demo-kwesi";

  const ama = await prisma.case.create({
    data: {
      id: "case-ama-maternal",
      chwId,
      patientType: PatientType.MATERNAL,
      patientName: "Ama Abugri",
      patientSex: PatientSex.FEMALE,
      ageValue: 28,
      ageUnit: AgeUnit.YEARS,
      community: "Zuo",
      phone: "+233244556677",
      maternalStatus: MaternalStatus.PREGNANT,
      gestationalWeeks: 34,
      consentAt: new Date(),
      status: CaseStatus.COMPLETED,
      riskTier: RiskTier.RED,
      syncedAt: new Date(),
      responses: {
        create: [
          {
            id: "resp-ama-bleed",
            itemKey: "maternal_bleeding",
            answer: true,
          },
          {
            id: "resp-ama-fever",
            itemKey: "maternal_high_fever",
            answer: false,
          },
        ],
      },
      referral: {
        create: {
          id: "ref-ama",
          status: ReferralStatus.REFERRED,
          facility: "Bolgatanga Central Hospital",
        },
      },
      timeline: {
        create: [
          {
            kind: "referral_created",
            message: "Referral Form Submitted",
          },
          {
            kind: "sms_sent",
            message: "Facility Notified via AgooSMS",
          },
        ],
      },
    },
  });

  const kofi = await prisma.case.create({
    data: {
      id: "case-kofi-under5",
      chwId,
      patientType: PatientType.UNDER5,
      patientName: "Kofi Apuri",
      patientSex: PatientSex.MALE,
      ageValue: 2,
      ageUnit: AgeUnit.YEARS,
      community: "Sakasaka",
      caregiverName: "Amina Apuri",
      caregiverPhone: "+233201112233",
      consentAt: new Date(),
      status: CaseStatus.COMPLETED,
      riskTier: RiskTier.YELLOW,
      syncedAt: new Date(),
      responses: {
        create: [
          {
            id: "resp-kofi-diarrhea",
            itemKey: "under5_diarrhea_sunken_eyes",
            answer: true,
          },
        ],
      },
      referral: {
        create: {
          id: "ref-kofi",
          status: ReferralStatus.IN_TRANSIT,
          facility: "Tamale Teaching Hospital",
        },
      },
    },
  });

  const afi = await prisma.case.create({
    data: {
      id: "case-afi-newborn",
      chwId,
      patientType: PatientType.NEWBORN,
      patientName: "Afi Mensah",
      patientSex: PatientSex.FEMALE,
      ageValue: 5,
      ageUnit: AgeUnit.DAYS,
      community: "Tamale North",
      caregiverName: "Fatima Mensah",
      caregiverPhone: "+233277889900",
      consentAt: new Date(),
      status: CaseStatus.COMPLETED,
      riskTier: RiskTier.GREEN,
      syncedAt: new Date(),
      responses: {
        create: [
          {
            id: "resp-afi-feed",
            itemKey: "newborn_unable_to_feed",
            answer: false,
          },
        ],
      },
      referral: {
        create: {
          id: "ref-afi",
          status: ReferralStatus.RESOLVED,
          facility: "CHPS Compound — Tamale North",
        },
      },
    },
  });

  console.log("Seeded cases:", { ama: ama.id, kofi: kofi.id, afi: afi.id });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
