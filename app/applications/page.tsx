import type { ApplicationMembershipSummary } from "@/api/applications-membership-api/types";

import { Chip, Link, Table, buttonVariants } from "@heroui/react";

import ApplicationCardSummary from "./application-card-summary";

import { applicationsBreadcrumb } from "@/config/breadcrumbs";
import { LocalDateTime } from "@/components/local-date-time";
import { StaffAppBreadcrumbs } from "@/components/staff-app-breadcrumbs";

export default async function ApplicationsPage() {
  const response = await fetch("http://localhost:8000/applications/recents");
  const data = (await response.json()) as ApplicationMembershipSummary[];

  return (
    <>
      <StaffAppBreadcrumbs items={[applicationsBreadcrumb]} />
      <h2 className="mb-3 font-bold ml-2">Membership Applications</h2>
      <section className="flex flex-col gap-4">
        <div className="hidden md:inline-block text-center justify-center">
          <Table>
            <Table.ScrollContainer>
              <Table.Content aria-label="Membership applications">
                <Table.Header>
                  <Table.Column className="text-center">#</Table.Column>
                  <Table.Column isRowHeader className="text-center">
                    Application ID
                  </Table.Column>
                  <Table.Column className="text-center">Person ID</Table.Column>
                  <Table.Column className="text-center">
                    Person Full Name
                  </Table.Column>
                  <Table.Column className="text-center">
                    Generated Date
                  </Table.Column>
                  <Table.Column className="text-center">
                    Fulfilment Date
                  </Table.Column>
                  <Table.Column className="text-center">
                    Is Fulfilled
                  </Table.Column>
                  <Table.Column className="text-center">Actions</Table.Column>
                </Table.Header>
                <Table.Body>
                  {data.map((application, index) => (
                    <Table.Row key={application.applicationId}>
                      <Table.Cell>{index + 1}</Table.Cell>
                      <Table.Cell>{application.applicationId}</Table.Cell>
                      <Table.Cell>{application.personId}</Table.Cell>
                      <Table.Cell>{application.personFullName}</Table.Cell>
                      <Table.Cell>
                        <LocalDateTime value={application.generatedDate} />
                      </Table.Cell>
                      <Table.Cell>
                        <LocalDateTime value={application.fulfilmentDate} />
                      </Table.Cell>
                      <Table.Cell>
                        <Chip
                          color={
                            application.isFulfilled ? "success" : "warning"
                          }
                        >
                          {application.isFulfilled ? "Yes" : "No"}
                        </Chip>
                      </Table.Cell>
                      <Table.Cell>
                        <Link
                          className={buttonVariants({
                            size: "sm",
                            variant: "secondary",
                          })}
                          href={`/applications/${application.applicationId}`}
                        >
                          Show more
                        </Link>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        </div>

        <div className="grid gap-3 md:hidden">
          {data.map((application) => (
            <ApplicationCardSummary
              key={application.applicationId}
              application={application}
            />
          ))}
        </div>
      </section>
    </>
  );
}
