"use client";
import React from "react";
import Link from "next/link";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
  Checkbox,
  Input,
} from "@heroui/react";
import Breadcrumb from "@/components/TableauDeBord/Breadcrumbs/Breadcrumb";

const LesDossiers: React.FC = () => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  return (
    <>
      <Breadcrumb pageName="Les différents dossiers" />
      <h4 className="mb-10 text-body-2xlg font-semibold text-dark dark:text-white">
        Les différents dossiers de DATALYS Consulting
      </h4>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6 xl:grid-cols-3 2xl:gap-7.5">
        <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark">
          <div className="flex h-14.5 w-14.5 items-center justify-center rounded-full bg-[#4aa9b8]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="text- fill-current"
              width="30"
              height="30"
              viewBox="0 0 24 24"
            >
              <path
                fill="#fff"
                d="M4 20q-.825 0-1.412-.587T2 18V6q0-.825.588-1.412T4 4h6l2 2h8q.825 0 1.413.588T22 8v10q0 .825-.587 1.413T20 20zm0-2h16V8h-8.825l-2-2H4zm0 0V6z"
              />
            </svg>
          </div>

          <div className="mt-6 flex items-end justify-between">
            <div className="flex items-center gap-2">
              <h4 className="mb-1.5 text-heading-6 font-bold text-dark dark:text-white">
                Dossier 1
              </h4>
              <Button
                as={Link}
                href="/tableaudebord/lesdossiers/voir"
                isIconOnly
                size="sm"
                color="primary"
                aria-label="voir"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="30"
                  height="30"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="#fff"
                    d="M12 9a3 3 0 0 1 3 3a3 3 0 0 1-3 3a3 3 0 0 1-3-3a3 3 0 0 1 3-3m0-4.5c5 0 9.27 3.11 11 7.5c-1.73 4.39-6 7.5-11 7.5S2.73 16.39 1 12c1.73-4.39 6-7.5 11-7.5M3.18 12a9.821 9.821 0 0 0 17.64 0a9.821 9.821 0 0 0-17.64 0"
                  />
                </svg>
              </Button>
              <Button
                isIconOnly
                size="sm"
                color="primary"
                aria-label="modifier"
                onPress={onOpen}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="25"
                  height="25"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="#fff"
                    d="M5 19h1.425L16.2 9.225L14.775 7.8L5 17.575zm-2 2v-4.25L16.2 3.575q.3-.275.663-.425t.762-.15t.775.15t.65.45L20.425 5q.3.275.438.65T21 6.4q0 .4-.137.763t-.438.662L7.25 21zM19 6.4L17.6 5zm-3.525 2.125l-.7-.725L16.2 9.225z"
                  />
                </svg>
              </Button>
              <Button
                isIconOnly
                size="sm"
                color="danger"
                aria-label="supprimer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="25"
                  height="25"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="#fff"
                    d="M7 21q-.825 0-1.412-.587T5 19V6H4V4h5V3h6v1h5v2h-1v13q0 .825-.587 1.413T17 21zM17 6H7v13h10zM9 17h2V8H9zm4 0h2V8h-2zM7 6v13z"
                  />
                </svg>
              </Button>
            </div>
          </div>
        </div>
        <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark">
          <div className="flex h-14.5 w-14.5 items-center justify-center rounded-full bg-[#4aa9b8]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="text- fill-current"
              width="30"
              height="30"
              viewBox="0 0 24 24"
            >
              <path
                fill="#fff"
                d="M4 20q-.825 0-1.412-.587T2 18V6q0-.825.588-1.412T4 4h6l2 2h8q.825 0 1.413.588T22 8v10q0 .825-.587 1.413T20 20zm0-2h16V8h-8.825l-2-2H4zm0 0V6z"
              />
            </svg>
          </div>

          <div className="mt-6 flex items-end justify-between">
            <div className="flex items-center gap-2">
              <h4 className="mb-1.5 text-heading-6 font-bold text-dark dark:text-white">
                Dossier 2
              </h4>
              <Button
                as={Link}
                href="/tableaudebord/lesdossiers/voir"
                isIconOnly
                size="sm"
                color="primary"
                aria-label="voir"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="30"
                  height="30"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="#fff"
                    d="M12 9a3 3 0 0 1 3 3a3 3 0 0 1-3 3a3 3 0 0 1-3-3a3 3 0 0 1 3-3m0-4.5c5 0 9.27 3.11 11 7.5c-1.73 4.39-6 7.5-11 7.5S2.73 16.39 1 12c1.73-4.39 6-7.5 11-7.5M3.18 12a9.821 9.821 0 0 0 17.64 0a9.821 9.821 0 0 0-17.64 0"
                  />
                </svg>
              </Button>
              <Button
                isIconOnly
                size="sm"
                color="primary"
                aria-label="modifier"
                onPress={onOpen}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="25"
                  height="25"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="#fff"
                    d="M5 19h1.425L16.2 9.225L14.775 7.8L5 17.575zm-2 2v-4.25L16.2 3.575q.3-.275.663-.425t.762-.15t.775.15t.65.45L20.425 5q.3.275.438.65T21 6.4q0 .4-.137.763t-.438.662L7.25 21zM19 6.4L17.6 5zm-3.525 2.125l-.7-.725L16.2 9.225z"
                  />
                </svg>
              </Button>
              <Button
                isIconOnly
                size="sm"
                color="danger"
                aria-label="supprimer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="25"
                  height="25"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="#fff"
                    d="M7 21q-.825 0-1.412-.587T5 19V6H4V4h5V3h6v1h5v2h-1v13q0 .825-.587 1.413T17 21zM17 6H7v13h10zM9 17h2V8H9zm4 0h2V8h-2zM7 6v13z"
                  />
                </svg>
              </Button>
            </div>
          </div>
        </div>
        <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark">
          <div className="flex h-14.5 w-14.5 items-center justify-center rounded-full bg-[#4aa9b8]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="text- fill-current"
              width="30"
              height="30"
              viewBox="0 0 24 24"
            >
              <path
                fill="#fff"
                d="M4 20q-.825 0-1.412-.587T2 18V6q0-.825.588-1.412T4 4h6l2 2h8q.825 0 1.413.588T22 8v10q0 .825-.587 1.413T20 20zm0-2h16V8h-8.825l-2-2H4zm0 0V6z"
              />
            </svg>
          </div>

          <div className="mt-6 flex items-end justify-between">
            <div className="flex items-center gap-2">
              <h4 className="mb-1.5 text-heading-6 font-bold text-dark dark:text-white">
                Dossier 3
              </h4>
              <Button
                as={Link}
                href="/tableaudebord/lesdossiers/voir"
                isIconOnly
                size="sm"
                color="primary"
                aria-label="voir"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="30"
                  height="30"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="#fff"
                    d="M12 9a3 3 0 0 1 3 3a3 3 0 0 1-3 3a3 3 0 0 1-3-3a3 3 0 0 1 3-3m0-4.5c5 0 9.27 3.11 11 7.5c-1.73 4.39-6 7.5-11 7.5S2.73 16.39 1 12c1.73-4.39 6-7.5 11-7.5M3.18 12a9.821 9.821 0 0 0 17.64 0a9.821 9.821 0 0 0-17.64 0"
                  />
                </svg>
              </Button>
              <Button
                isIconOnly
                size="sm"
                color="primary"
                aria-label="modifier"
                onPress={onOpen}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="25"
                  height="25"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="#fff"
                    d="M5 19h1.425L16.2 9.225L14.775 7.8L5 17.575zm-2 2v-4.25L16.2 3.575q.3-.275.663-.425t.762-.15t.775.15t.65.45L20.425 5q.3.275.438.65T21 6.4q0 .4-.137.763t-.438.662L7.25 21zM19 6.4L17.6 5zm-3.525 2.125l-.7-.725L16.2 9.225z"
                  />
                </svg>
              </Button>
              <Button
                isIconOnly
                size="sm"
                color="danger"
                aria-label="supprimer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="25"
                  height="25"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="#fff"
                    d="M7 21q-.825 0-1.412-.587T5 19V6H4V4h5V3h6v1h5v2h-1v13q0 .825-.587 1.413T17 21zM17 6H7v13h10zM9 17h2V8H9zm4 0h2V8h-2zM7 6v13z"
                  />
                </svg>
              </Button>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6 xl:grid-cols-3 2xl:gap-7.5">
        <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark">
          <div className="flex h-14.5 w-14.5 items-center justify-center rounded-full bg-[#4aa9b8]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="text- fill-current"
              width="30"
              height="30"
              viewBox="0 0 24 24"
            >
              <path
                fill="#fff"
                d="M4 20q-.825 0-1.412-.587T2 18V6q0-.825.588-1.412T4 4h6l2 2h8q.825 0 1.413.588T22 8v10q0 .825-.587 1.413T20 20zm0-2h16V8h-8.825l-2-2H4zm0 0V6z"
              />
            </svg>
          </div>

          <div className="mt-6 flex items-end justify-between">
            <div className="flex items-center gap-2">
              <h4 className="mb-1.5 text-heading-6 font-bold text-dark dark:text-white">
                Dossier 4
              </h4>
              <Button
                as={Link}
                href="/tableaudebord/lesdossiers/voir"
                isIconOnly
                size="sm"
                color="primary"
                aria-label="voir"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="30"
                  height="30"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="#fff"
                    d="M12 9a3 3 0 0 1 3 3a3 3 0 0 1-3 3a3 3 0 0 1-3-3a3 3 0 0 1 3-3m0-4.5c5 0 9.27 3.11 11 7.5c-1.73 4.39-6 7.5-11 7.5S2.73 16.39 1 12c1.73-4.39 6-7.5 11-7.5M3.18 12a9.821 9.821 0 0 0 17.64 0a9.821 9.821 0 0 0-17.64 0"
                  />
                </svg>
              </Button>
              <Button
                isIconOnly
                size="sm"
                color="primary"
                aria-label="modifier"
                onPress={onOpen}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="25"
                  height="25"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="#fff"
                    d="M5 19h1.425L16.2 9.225L14.775 7.8L5 17.575zm-2 2v-4.25L16.2 3.575q.3-.275.663-.425t.762-.15t.775.15t.65.45L20.425 5q.3.275.438.65T21 6.4q0 .4-.137.763t-.438.662L7.25 21zM19 6.4L17.6 5zm-3.525 2.125l-.7-.725L16.2 9.225z"
                  />
                </svg>
              </Button>
              <Button
                isIconOnly
                size="sm"
                color="danger"
                aria-label="supprimer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="25"
                  height="25"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="#fff"
                    d="M7 21q-.825 0-1.412-.587T5 19V6H4V4h5V3h6v1h5v2h-1v13q0 .825-.587 1.413T17 21zM17 6H7v13h10zM9 17h2V8H9zm4 0h2V8h-2zM7 6v13z"
                  />
                </svg>
              </Button>
            </div>
          </div>
        </div>
        <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark">
          <div className="flex h-14.5 w-14.5 items-center justify-center rounded-full bg-[#4aa9b8]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="text- fill-current"
              width="30"
              height="30"
              viewBox="0 0 24 24"
            >
              <path
                fill="#fff"
                d="M4 20q-.825 0-1.412-.587T2 18V6q0-.825.588-1.412T4 4h6l2 2h8q.825 0 1.413.588T22 8v10q0 .825-.587 1.413T20 20zm0-2h16V8h-8.825l-2-2H4zm0 0V6z"
              />
            </svg>
          </div>

          <div className="mt-6 flex items-end justify-between">
            <div className="flex items-center gap-2">
              <h4 className="mb-1.5 text-heading-6 font-bold text-dark dark:text-white">
                Dossier 5
              </h4>
              <Button
                as={Link}
                href="/tableaudebord/lesdossiers/voir"
                isIconOnly
                size="sm"
                color="primary"
                aria-label="voir"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="30"
                  height="30"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="#fff"
                    d="M12 9a3 3 0 0 1 3 3a3 3 0 0 1-3 3a3 3 0 0 1-3-3a3 3 0 0 1 3-3m0-4.5c5 0 9.27 3.11 11 7.5c-1.73 4.39-6 7.5-11 7.5S2.73 16.39 1 12c1.73-4.39 6-7.5 11-7.5M3.18 12a9.821 9.821 0 0 0 17.64 0a9.821 9.821 0 0 0-17.64 0"
                  />
                </svg>
              </Button>
              <Button
                isIconOnly
                size="sm"
                color="primary"
                aria-label="modifier"
                onPress={onOpen}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="25"
                  height="25"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="#fff"
                    d="M5 19h1.425L16.2 9.225L14.775 7.8L5 17.575zm-2 2v-4.25L16.2 3.575q.3-.275.663-.425t.762-.15t.775.15t.65.45L20.425 5q.3.275.438.65T21 6.4q0 .4-.137.763t-.438.662L7.25 21zM19 6.4L17.6 5zm-3.525 2.125l-.7-.725L16.2 9.225z"
                  />
                </svg>
              </Button>
              <Button
                isIconOnly
                size="sm"
                color="danger"
                aria-label="supprimer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="25"
                  height="25"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="#fff"
                    d="M7 21q-.825 0-1.412-.587T5 19V6H4V4h5V3h6v1h5v2h-1v13q0 .825-.587 1.413T17 21zM17 6H7v13h10zM9 17h2V8H9zm4 0h2V8h-2zM7 6v13z"
                  />
                </svg>
              </Button>
            </div>
          </div>
        </div>
        <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark">
          <div className="flex h-14.5 w-14.5 items-center justify-center rounded-full bg-[#4aa9b8]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="text- fill-current"
              width="30"
              height="30"
              viewBox="0 0 24 24"
            >
              <path
                fill="#fff"
                d="M4 20q-.825 0-1.412-.587T2 18V6q0-.825.588-1.412T4 4h6l2 2h8q.825 0 1.413.588T22 8v10q0 .825-.587 1.413T20 20zm0-2h16V8h-8.825l-2-2H4zm0 0V6z"
              />
            </svg>
          </div>

          <div className="mt-6 flex items-end justify-between">
            <div className="flex items-center gap-2">
              <h4 className="mb-1.5 text-heading-6 font-bold text-dark dark:text-white">
                Dossier 6
              </h4>
              <Button
                as={Link}
                href="/tableaudebord/lesdossiers/voir"
                isIconOnly
                size="sm"
                color="primary"
                aria-label="voir"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="30"
                  height="30"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="#fff"
                    d="M12 9a3 3 0 0 1 3 3a3 3 0 0 1-3 3a3 3 0 0 1-3-3a3 3 0 0 1 3-3m0-4.5c5 0 9.27 3.11 11 7.5c-1.73 4.39-6 7.5-11 7.5S2.73 16.39 1 12c1.73-4.39 6-7.5 11-7.5M3.18 12a9.821 9.821 0 0 0 17.64 0a9.821 9.821 0 0 0-17.64 0"
                  />
                </svg>
              </Button>
              <Button
                isIconOnly
                size="sm"
                color="primary"
                aria-label="modifier"
                onPress={onOpen}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="25"
                  height="25"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="#fff"
                    d="M5 19h1.425L16.2 9.225L14.775 7.8L5 17.575zm-2 2v-4.25L16.2 3.575q.3-.275.663-.425t.762-.15t.775.15t.65.45L20.425 5q.3.275.438.65T21 6.4q0 .4-.137.763t-.438.662L7.25 21zM19 6.4L17.6 5zm-3.525 2.125l-.7-.725L16.2 9.225z"
                  />
                </svg>
              </Button>
              <Button
                isIconOnly
                size="sm"
                color="danger"
                aria-label="supprimer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="25"
                  height="25"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="#fff"
                    d="M7 21q-.825 0-1.412-.587T5 19V6H4V4h5V3h6v1h5v2h-1v13q0 .825-.587 1.413T17 21zM17 6H7v13h10zM9 17h2V8H9zm4 0h2V8h-2zM7 6v13z"
                  />
                </svg>
              </Button>
            </div>
          </div>
        </div>
      </div>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="top-center">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Modifier le dossier
              </ModalHeader>
              <ModalBody>
                <Input
                  autoFocus
                  label="Nom du dossier"
                  type="text"
                  placeholder="Entrer le nom du dossier"
                  variant="bordered"
                />
                <Input
                  label="Date"
                 
                  type="date"
                  variant="bordered"
                />
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="flat" onPress={onClose}>
                  Fermer
                </Button>
                <Button color="primary" onPress={onClose}>
                  Modifier
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};

export default LesDossiers;
