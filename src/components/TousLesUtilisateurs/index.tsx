import React from "react";
import Link from "next/link";
import { Card, CardFooter, Image, Button } from "@heroui/react";

const AllUsers: React.FC = () => {
  return (
    <>
      <div className="mx-auto grid h-screen max-w-4xl place-items-center">
        <div className="grid grid-cols-2 gap-2 border-stroke px-1">
          <div>
            <Card isFooterBlurred radius="lg" className="border-1 shadow-2xl">
              <Image
                alt=""
                className="object-cover"
                height={200}
                src="/images/logo-datalys-rvb.jpg"
                width={300}
              />
              <CardFooter className="absolute bottom-1 z-10 ml-1 w-[calc(100%_-_8px)] justify-between overflow-hidden rounded-large border-1 border-white/20 py-1 shadow-lg before:rounded-xl before:bg-white/10">
                <p className="text-base text-white/80">Client</p>
                <Button
                  as={Link}
                  href="/connexionclient"
                  className="bg-black/20 text-tiny text-white"
                  variant="flat"
                  color="default"
                  radius="lg"
                  size="sm"
                >
                  Connexion
                </Button>
              </CardFooter>
            </Card>
          </div>
          <div>
            <Card isFooterBlurred radius="lg" className="border-1 shadow-2xl">
              <Image
                alt=""
                className="object-cover"
                height={200}
                src="/images/logo-datalys-rvb.jpg"
                width={300}
              />
              <CardFooter className="absolute bottom-1 z-10 ml-1 w-[calc(100%_-_8px)] justify-between overflow-hidden rounded-large border-1 border-white/20 py-1 shadow-lg before:rounded-xl before:bg-white/10">
                <p className="text-base text-white/80">Administrateur</p>
                <Button
                  as={Link}
                  href="/connexion"
                  className="bg-black/20 text-tiny text-white"
                  variant="flat"
                  color="default"
                  radius="lg"
                  size="sm"
                >
                  Connexion
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
      <div className="-mt-9 flex justify-center px-3 pb-4">
        <p className="text-dark">
          All Rights Reserved by
          <Link
            className="ml-1 font-medium text-primary"
            href="https://www.datalysconsulting.com/"
            target="_blank"
          >
            DATALYS Consulting
          </Link>
          . Designed and Developed by{" "}
          <Link className="text-primary" href="javascript:;">
            LA VICTOIRE
          </Link>
          .
        </p>
      </div>
    </>
  );
};

export default AllUsers;
