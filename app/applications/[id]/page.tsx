import { Card } from "@heroui/react/card";
import { Accordion } from "@heroui/react/accordion";
import { ChevronDownIcon } from "@heroicons/react/24/solid";

import { applicationsBreadcrumb } from "@/config/breadcrumbs";
import { StaffAppPageHeader } from "@/components/staff-app-page-header";
import { getApplicationDetail } from "@/api/applications-membership-api/client";
import { LocalDateTime } from "@/components/local-date-time";

export default async function ApplicationDetail({
  params,
}: {
  params: { id: string };
}) {
  const { id } = await params;

  const application = await getApplicationDetail(id);

  const {
    personFullName,
    applicationId,
    fulfilmentDate,
    lifeBefore,
    conversion,
    lifeAfter,
  } = application;

  return (
    <div>
      <StaffAppPageHeader
        breadcrumbs={[
          applicationsBreadcrumb,
          {
            label: personFullName,
            href: `/applications/${applicationId}`,
          },
        ]}
        title={`Application from:  ${personFullName}`}
      />
      <Card.Root>
        <Card.Header>
          <Card.Title>{personFullName}</Card.Title>
          <Card.Description>
            Fulfilment Date: <LocalDateTime value={fulfilmentDate} />
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <Accordion
            allowsMultipleExpanded={true}
            className="w-full max-w-md"
            defaultExpandedKeys={["life_before_1"]}
          >
            <Accordion.Item id="life_before_1">
              <Accordion.Heading>
                <Accordion.Trigger>
                  Life Before
                  <Accordion.Indicator>
                    <ChevronDownIcon />
                  </Accordion.Indicator>
                </Accordion.Trigger>
              </Accordion.Heading>
              <Accordion.Panel>
                <Accordion.Body>{lifeBefore}</Accordion.Body>
              </Accordion.Panel>
            </Accordion.Item>
            <Accordion.Item id="conversion_2">
              <Accordion.Heading>
                <Accordion.Trigger>
                  Conversion
                  <Accordion.Indicator>
                    <ChevronDownIcon />
                  </Accordion.Indicator>
                </Accordion.Trigger>
              </Accordion.Heading>
              <Accordion.Panel>
                <Accordion.Body>{conversion}</Accordion.Body>
              </Accordion.Panel>
            </Accordion.Item>
            <Accordion.Item id="life_after_3">
              <Accordion.Heading>
                <Accordion.Trigger>
                  Life After
                  <Accordion.Indicator>
                    <ChevronDownIcon />
                  </Accordion.Indicator>
                </Accordion.Trigger>
              </Accordion.Heading>
              <Accordion.Panel>
                <Accordion.Body>{lifeAfter}</Accordion.Body>
              </Accordion.Panel>
            </Accordion.Item>
          </Accordion>
        </Card.Content>
      </Card.Root>
    </div>
  );
}
