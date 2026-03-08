"use client";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";
import React from "react";
import Link from "next/link";
import Iframe from "react-iframe";
import { Button } from "@heroui/button";
import Breadcrumb from "@/components/TableauDeBord/Breadcrumbs/Breadcrumb";

const VoirDossier = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [size, setSize] = React.useState<"sm" | "md" | "lg" | "xl" | "2xl" | "xs" | "3xl" | "4xl" | "5xl" | "full">("2xl");
  const sizes = "2xl";

  const handleOpen = (size: "sm" | "md" | "lg" | "xl" | "2xl" | "xs" | "3xl" | "4xl" | "5xl" | "full") => {
    setSize(size);
    onOpen();
  };
  return (
    <>
      <Breadcrumb pageName="Les différents fichiers" />
      <div className="mt-5 w-full max-w-full rounded-[10px]">
        <div className="mt-8 rounded-[10px] bg-white dark:bg-gray-800 shadow-1 dark:bg-gray-dark dark:shadow-card">
          <div className="w-full max-w-full p-2">
            <div className="flex w-full justify-start gap-6">
              <h3 className="pt-2 text-[22px] font-medium text-dark dark:text-white">
                Les différents fichiers
              </h3>
            </div>
          </div>
          <div className="mt-4 overflow-x-auto rounded-lg border shadow-sm">
            <table className="w-full table-auto text-left text-sm">
              <thead className="border-b bg-gray-1 font-medium text-dark dark:bg-gray-dark dark:text-white">
                <tr>
                  <th className="px-3 py-3">Nom du fichier</th>
                  <th className="px-3 py-3">Format</th>
                  <th className="px-3 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="mb-3 divide-y text-gray-600 dark:text-gray-400">
                <tr>
                  <td className="whitespace-nowrap px-3 py-4 text-dark dark:text-white">
                    Revue du cahier de charge du projet 1
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-dark dark:text-white">
                    PDF
                  </td>
                  <td className="flex items-center gap-2 whitespace-nowrap px-5 py-4">
                    <Button
                      size="sm"
                      variant="solid"
                      color="primary"
                      onPress={() => handleOpen(size)}
                    >
                      <img
                        src="/images/icon/file-button.svg"
                        width={15}
                        height={15}
                      />
                    </Button>
                    <Button size="sm" variant="solid" color="primary">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="30"
                        height="30"
                        viewBox="0 0 24 24"
                      >
                        <path
                          fill="#fff"
                          d="m12 15.577l-3.539-3.538l.708-.72L11.5 13.65V5h1v8.65l2.33-2.33l.709.719zM6.616 19q-.691 0-1.153-.462T5 17.384v-2.423h1v2.423q0 .231.192.424t.423.192h10.77q.23 0 .423-.192t.192-.424v-2.423h1v2.423q0 .691-.462 1.153T17.384 19z"
                        />
                      </svg>
                    </Button>
                    {/* <Button
                      as={Link}
                      href="/tableaudebord/projet/modifier"
                      isIconOnly
                      size="sm"
                      color="primary"
                      aria-label="modifier"
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
                    </Button> */}
                    {/* <Button
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
                    </Button> */}
                  </td>
                </tr>
                <tr>
                  <td className="whitespace-nowrap px-3 py-4 text-dark dark:text-white">
                    Planification du cahier de charge du projet 1
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-dark dark:text-white">
                    WORD
                  </td>
                  <td className="flex items-center gap-2 whitespace-nowrap px-5 py-4">
                    <Button
                      size="sm"
                      variant="solid"
                      color="primary"
                      onPress={() => handleOpen(size)}
                    >
                      <img
                        src="/images/icon/file-button.svg"
                        width={15}
                        height={15}
                      />
                    </Button>
                    <Button size="sm" variant="solid" color="primary">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="30"
                        height="30"
                        viewBox="0 0 24 24"
                      >
                        <path
                          fill="#fff"
                          d="m12 15.577l-3.539-3.538l.708-.72L11.5 13.65V5h1v8.65l2.33-2.33l.709.719zM6.616 19q-.691 0-1.153-.462T5 17.384v-2.423h1v2.423q0 .231.192.424t.423.192h10.77q.23 0 .423-.192t.192-.424v-2.423h1v2.423q0 .691-.462 1.153T17.384 19z"
                        />
                      </svg>
                    </Button>
                    {/* <Button
                      as={Link}
                      href="/tableaudebord/projet/modifier"
                      isIconOnly
                      size="sm"
                      color="primary"
                      aria-label="modifier"
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
                    </Button> */}
                    {/* <Button
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
                    </Button> */}
                  </td>
                </tr>
                <tr>
                  <td className="whitespace-nowrap px-3 py-4 text-dark dark:text-white">
                    Revue du cahier de charge du projet 2
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-dark dark:text-white">
                    PDF
                  </td>
                  <td className="flex items-center gap-2 whitespace-nowrap px-5 py-4">
                    <Button
                      size="sm"
                      variant="solid"
                      color="primary"
                      onPress={() => handleOpen(size)}
                    >
                      <img
                        src="/images/icon/file-button.svg"
                        width={15}
                        height={15}
                      />
                    </Button>
                    <Button size="sm" variant="solid" color="primary">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="30"
                        height="30"
                        viewBox="0 0 24 24"
                      >
                        <path
                          fill="#fff"
                          d="m12 15.577l-3.539-3.538l.708-.72L11.5 13.65V5h1v8.65l2.33-2.33l.709.719zM6.616 19q-.691 0-1.153-.462T5 17.384v-2.423h1v2.423q0 .231.192.424t.423.192h10.77q.23 0 .423-.192t.192-.424v-2.423h1v2.423q0 .691-.462 1.153T17.384 19z"
                        />
                      </svg>
                    </Button>
                    {/* <Button
                      as={Link}
                      href="/tableaudebord/projet/modifier"
                      isIconOnly
                      size="sm"
                      color="primary"
                      aria-label="modifier"
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
                    </Button> */}
                    {/* <Button
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
                    </Button> */}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div className="mt-7 grid grid-cols-5 gap-8">
        <div className="col-span-5 xl:col-span-5">
          <div className="rounded-[10px] border border-stroke bg-white dark:bg-gray-800 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
            <div className="border-b border-stroke px-7 py-4 dark:border-dark-3">
              <h3 className="font-medium text-dark dark:text-white">
                Charger le fichier
              </h3>
            </div>
            <div className="p-7">
              <form>
                <div
                  id="FileUpload"
                  className="relative mb-5.5 block w-full cursor-pointer appearance-none rounded-xl border border-dashed border-gray-4 bg-gray-2 px-4 py-4 hover:border-primary dark:border-dark-3 dark:bg-dark-2 dark:hover:border-primary sm:py-7.5"
                >
                  <input
                    type="file"
                    name="profilePhoto"
                    id="profilePhoto"
                    accept="image/png, image/jpg, image/jpeg"
                    className="absolute inset-0 z-50 m-0 h-full w-full cursor-pointer p-0 opacity-0 outline-none"
                  />
                  <div className="flex flex-col items-center justify-center">
                    <span className="flex h-13.5 w-13.5 items-center justify-center rounded-full border border-stroke bg-white dark:border-dark-3 dark:bg-gray-dark">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M10.4613 2.07827C10.3429 1.94876 10.1755 1.875 10 1.875C9.82453 1.875 9.65714 1.94876 9.53873 2.07827L6.2054 5.7241C5.97248 5.97885 5.99019 6.37419 6.24494 6.6071C6.49969 6.84002 6.89502 6.82232 7.12794 6.56756L9.375 4.10984V13.3333C9.375 13.6785 9.65482 13.9583 10 13.9583C10.3452 13.9583 10.625 13.6785 10.625 13.3333V4.10984L12.8721 6.56756C13.105 6.82232 13.5003 6.84002 13.7551 6.6071C14.0098 6.37419 14.0275 5.97885 13.7946 5.7241L10.4613 2.07827Z"
                          fill="#5750F1"
                        />
                        <path
                          d="M3.125 12.5C3.125 12.1548 2.84518 11.875 2.5 11.875C2.15482 11.875 1.875 12.1548 1.875 12.5V12.5457C1.87498 13.6854 1.87497 14.604 1.9721 15.3265C2.07295 16.0765 2.2887 16.7081 2.79029 17.2097C3.29189 17.7113 3.92345 17.9271 4.67354 18.0279C5.39602 18.125 6.31462 18.125 7.45428 18.125H12.5457C13.6854 18.125 14.604 18.125 15.3265 18.0279C16.0766 17.9271 16.7081 17.7113 17.2097 17.2097C17.7113 16.7081 17.9271 16.0765 18.0279 15.3265C18.125 14.604 18.125 13.6854 18.125 12.5457V12.5C18.125 12.1548 17.8452 11.875 17.5 11.875C17.1548 11.875 16.875 12.1548 16.875 12.5C16.875 13.6962 16.8737 14.5304 16.789 15.1599C16.7068 15.7714 16.5565 16.0952 16.3258 16.3258C16.0952 16.5565 15.7714 16.7068 15.1599 16.789C14.5304 16.8737 13.6962 16.875 12.5 16.875H7.5C6.30382 16.875 5.46956 16.8737 4.8401 16.789C4.22862 16.7068 3.90481 16.5565 3.67418 16.3258C3.44354 16.0952 3.29317 15.7714 3.21096 15.1599C3.12633 14.5304 3.125 13.6962 3.125 12.5Z"
                          fill="#5750F1"
                        />
                      </svg>
                    </span>
                    <p className="mt-2.5 text-body-sm font-medium">
                      <span className="text-primary">
                        Cliquez pour télécharger
                      </span>{" "}
                      ou par glisser-déposer
                    </p>
                    <p className="mt-1 text-body-xs">
                      PDF OU WORD (max, 800 X 800px)
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    className="flex items-center justify-center rounded-[7px] bg-primary px-6 py-[7px] font-medium text-gray-2 hover:bg-opacity-90"
                    type="submit"
                  >
                    Charger
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      <Modal
        size={size}
        isOpen={isOpen}
        onClose={onClose}
        isDismissable={false}
        isKeyboardDismissDisabled={true}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Le fichier chargé
              </ModalHeader>
              <ModalBody>
                <Iframe
                  url="/file/CAHIER DE CHARGES FONCTIONNEL - DATALYS-Consulting.pdf"
                  width="640px"
                  height="320px"
                ></Iframe>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Fermer
                </Button>
                <Button color="primary" onPress={onClose}>
                  Terminer
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};

export default VoirDossier;
